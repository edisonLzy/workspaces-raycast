import { useState, useCallback } from 'react';
import { showToast, Toast } from '@raycast/api';
import {
  buildBranchNamePrompt,
  BranchNameResponseSchema,
} from '../prompts/worktree';
import { useGemini } from './useGemini';
import type { Requirement } from '../types';

/**
 * Hook: AI 生成分支名称
 * 包含: AI 调用 → 错误处理 → Toast 提示 → 完整业务流程
 */
export function useGenerateBranchName(requirement: Requirement) {
  const { query } = useGemini();
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * 生成分支名称
   * @param featureType - Feature 类型 (feat/fix)
   * @returns 生成的分支名称
   */
  const generateBranchName = useCallback(
    async (featureType: 'feat' | 'fix'): Promise<string | null> => {
      setIsGenerating(true);

      try {
        await showToast({
          style: Toast.Style.Animated,
          title: '正在生成分支名称...',
        });

        // 构建 prompt
        const prompt = buildBranchNamePrompt(
          requirement.name,
          requirement.id,
          featureType,
        );

        // 调用 Gemini AI
        const response = await query(prompt, BranchNameResponseSchema);

        await showToast({
          style: Toast.Style.Success,
          title: '分支名称生成成功',
          message: response.branchName,
        });

        return response.branchName;
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: 'AI 生成失败',
          message: error instanceof Error ? error.message : String(error),
        });
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [requirement.name, requirement.id, query],
  );

  return {
    generateBranchName,
    isGenerating,
  };
}
