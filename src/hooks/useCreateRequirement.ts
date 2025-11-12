import { randomUUID } from 'node:crypto';
import { useCallback } from 'react';
import { showToast, Toast } from '@raycast/api';
import { useRequirements } from './useRequirements';
import type { Requirement } from '../types';

/**
 * Hook: 手动创建单个需求
 * 包含: 验证 + 保存 + Toast + 缓存刷新
 */
export function useCreateRequirement() {
  const { updateRequirements } = useRequirements();

  return useCallback(
    async (newRequirement: Omit<Requirement, 'id' | 'worktrees'>) => {
      await showToast({
        style: Toast.Style.Animated,
        title: '创建需求中...',
      });

      try {
        const requirement: Requirement = {
          ...newRequirement,
          id: randomUUID(),
          worktrees: [],
        };

        await updateRequirements((prev) => [...prev, requirement]);

        await showToast({
          style: Toast.Style.Success,
          title: '需求创建成功',
        });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: '创建失败',
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [updateRequirements],
  );
}
