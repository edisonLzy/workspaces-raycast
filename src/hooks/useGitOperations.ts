import { useCallback } from 'react';
import {
  showToast,
  Toast,
  confirmAlert,
  Alert,
  getPreferenceValues,
} from '@raycast/api';
import * as execUtils from '../utils/exec';
import * as pathUtils from '../utils/path';
import * as fsUtils from '../utils/fs';
import {
  useAddWorktree,
  useRemoveWorktreeFromRequirement,
} from './useRequirements';
import { checkBranchExists } from './useGitRepository';
import type { Preferences } from '../types';

export interface CreateWorktreeParams {
  requirementId: string;
  repoPath: string;
  branch: string;
  label: string;
  repository: string;
}

/**
 * Hook: 创建 worktree
 * 包含: 验证 → Git 命令执行 → Toast → 数据更新 → 完整业务流程
 */
export function useCreateWorktree() {
  const addWorktree = useAddWorktree();
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(
    async (params: CreateWorktreeParams) => {
      await showToast({
        style: Toast.Style.Animated,
        title: '创建 worktree 中...',
      });

      try {
        // 1. 生成目标路径
        const targetPath = pathUtils.getWorktreePath(
          workspaceRoot,
          params.branch,
        );

        // 2. 检查路径是否已存在
        const pathExists = await fsUtils.exists(targetPath);
        if (pathExists) {
          const confirmed = await confirmAlert({
            title: '路径已存在',
            message: `目标路径 ${targetPath} 已存在,是否删除后继续?`,
            primaryAction: {
              title: '删除并继续',
              style: Alert.ActionStyle.Destructive,
            },
          });

          if (!confirmed) {
            throw new Error('用户取消操作');
          }

          // 删除已存在的路径
          await execUtils.execGit(
            ['worktree', 'remove', '--force', targetPath],
            {
              cwd: params.repoPath,
              timeout: 10000,
            },
          );
        }

        // 3. 检查分支是否已存在
        const branchExists = await checkBranchExists(
          params.repoPath,
          params.branch,
        );
        if (branchExists) {
          throw new Error(`分支 ${params.branch} 已存在,请使用其他名称`);
        }

        // 4. 执行 git worktree add (调用纯工具函数)
        await execUtils.execGit(
          ['worktree', 'add', '-b', params.branch, targetPath],
          {
            cwd: params.repoPath,
            timeout: 30000,
          },
        );

        // 5. 更新需求数据
        await addWorktree(params.requirementId, {
          label: params.label,
          path: targetPath,
          branch: params.branch,
          repository: params.repository,
        });

        await showToast({
          style: Toast.Style.Success,
          title: 'Worktree 创建成功',
          message: `分支: ${params.branch}`,
        });

        return targetPath;
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: '创建失败',
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [addWorktree, workspaceRoot],
  );
}

/**
 * Hook: 删除 worktree
 * 包含: 二次确认 → Git 命令执行 → Toast → 数据更新
 */
export function useRemoveWorktree() {
  const removeWorktree = useRemoveWorktreeFromRequirement();

  return useCallback(
    async (requirementId: string, worktreePath: string, repoPath: string) => {
      // 1. 二次确认
      const confirmed = await confirmAlert({
        title: '删除 Worktree',
        message: `确定要删除 ${worktreePath} 吗?`,
        primaryAction: {
          title: '删除',
          style: Alert.ActionStyle.Destructive,
        },
      });

      if (!confirmed) return;

      await showToast({
        style: Toast.Style.Animated,
        title: '删除 worktree 中...',
      });

      try {
        // 2. 执行 git worktree remove
        await execUtils.execGit(['worktree', 'remove', worktreePath], {
          cwd: repoPath,
          timeout: 10000,
        });

        // 3. 更新需求数据
        await removeWorktree(requirementId, worktreePath);

        await showToast({
          style: Toast.Style.Success,
          title: 'Worktree 删除成功',
        });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: '删除失败',
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [removeWorktree],
  );
}
