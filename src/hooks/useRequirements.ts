import { useCachedPromise } from '@raycast/utils';
import { useCallback, useMemo } from 'react';
import { showToast, Toast, getPreferenceValues } from '@raycast/api';
import * as fsUtils from '../utils/fs';
import * as pathUtils from '../utils/path';
import type {
  Requirement,
  RequirementsData,
  WorktreeInfo,
  Preferences,
} from '../types';

/**
 * Hook: 加载需求数据 (带缓存)
 * 包含: 文件读取 + 错误处理
 */
export function useRequirements() {
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCachedPromise(
    async () => {
      const filePath = pathUtils.getDataFilePath(workspaceRoot);
      try {
        const data = await fsUtils.readJSON<RequirementsData>(filePath);
        return data.requirements;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return []; // 文件不存在,返回空数组
        }
        throw error;
      }
    },
    [],
    {
      keepPreviousData: true,
      initialData: [],
    },
  );
}

/**
 * Hook: 更新需求
 * 包含: 验证 + 保存 + Toast + 缓存刷新
 */
export function useUpdateRequirement() {
  const { mutate } = useRequirements();
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(
    async (
      requirementId: string,
      updates: Partial<Omit<Requirement, 'id'>>,
    ) => {
      await showToast({ style: Toast.Style.Animated, title: '更新需求中...' });

      try {
        const filePath = pathUtils.getDataFilePath(workspaceRoot);
        const data = await fsUtils.readJSON<RequirementsData>(filePath);

        const index = data.requirements.findIndex(
          (r) => r.id === requirementId,
        );
        if (index === -1) {
          throw new Error('需求不存在');
        }

        data.requirements[index] = {
          ...data.requirements[index],
          ...updates,
        };

        data.lastSyncAt = new Date().toISOString();
        await fsUtils.writeJSON(filePath, data);
        await mutate();

        await showToast({ style: Toast.Style.Success, title: '需求更新成功' });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: '更新失败',
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [mutate, workspaceRoot],
  );
}

/**
 * Hook: 删除需求
 * 包含: 确认 + 保存 + Toast + 缓存刷新
 */
export function useDeleteRequirement() {
  const { mutate } = useRequirements();
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(
    async (requirementId: string) => {
      await showToast({ style: Toast.Style.Animated, title: '删除需求中...' });

      try {
        const filePath = pathUtils.getDataFilePath(workspaceRoot);
        const data = await fsUtils.readJSON<RequirementsData>(filePath);

        data.requirements = data.requirements.filter(
          (r) => r.id !== requirementId,
        );
        data.lastSyncAt = new Date().toISOString();

        await fsUtils.writeJSON(filePath, data);
        await mutate();

        await showToast({ style: Toast.Style.Success, title: '需求删除成功' });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: '删除失败',
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [mutate, workspaceRoot],
  );
}

/**
 * Hook: 按迭代分组
 * 包含: 数据转换逻辑
 */
export function useGroupedRequirements() {
  const { data: requirements, isLoading } = useRequirements();

  const grouped = useMemo(() => {
    if (!requirements) return new Map();

    const map = new Map<string, Requirement[]>();
    requirements.forEach((req) => {
      if (!map.has(req.iteration)) {
        map.set(req.iteration, []);
      }
      map.get(req.iteration)!.push(req);
    });
    return map;
  }, [requirements]);

  return { data: grouped, isLoading };
}

/**
 * Hook: 添加 worktree 到需求
 */
export function useAddWorktree() {
  const updateRequirement = useUpdateRequirement();

  return useCallback(
    async (requirementId: string, worktree: WorktreeInfo) => {
      const { workspaceRoot } = getPreferenceValues<Preferences>();
      const filePath = pathUtils.getDataFilePath(workspaceRoot);
      const data = await fsUtils.readJSON<RequirementsData>(filePath);

      const requirement = data.requirements.find((r) => r.id === requirementId);
      if (!requirement) {
        throw new Error('需求不存在');
      }

      const worktrees = requirement.worktrees || [];
      worktrees.push(worktree);

      await updateRequirement(requirementId, { worktrees });
    },
    [updateRequirement],
  );
}

/**
 * Hook: 从需求中移除 worktree
 */
export function useRemoveWorktreeFromRequirement() {
  const updateRequirement = useUpdateRequirement();

  return useCallback(
    async (requirementId: string, worktreePath: string) => {
      const { workspaceRoot } = getPreferenceValues<Preferences>();
      const filePath = pathUtils.getDataFilePath(workspaceRoot);
      const data = await fsUtils.readJSON<RequirementsData>(filePath);

      const requirement = data.requirements.find((r) => r.id === requirementId);
      if (!requirement) {
        throw new Error('需求不存在');
      }

      const worktrees = (requirement.worktrees || []).filter(
        (w) => w.path !== worktreePath,
      );

      await updateRequirement(requirementId, { worktrees });
    },
    [updateRequirement],
  );
}
