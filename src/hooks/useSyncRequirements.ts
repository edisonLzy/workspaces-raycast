import { randomUUID } from 'node:crypto';
import { useCallback } from 'react';
import { showToast, Toast, getPreferenceValues } from '@raycast/api';
import dayjs from 'dayjs';
import { RequirementsSchema } from '../schemas/requirement';
import { buildGetRequirementsPrompt } from '../prompts/requirement';
import { useGemini } from './useGemini';
import { useRequirements } from './useRequirements';
import type { Preferences, Requirement } from '../types';

export interface SyncRequirementsParams {
  scheduleDocPath: string; // Excel 文件路径
  prompt: string; // 用户自定义筛选条件
}

/**
 * Hook: 从排期文档同步需求
 * 包含: Gemini CLI 集成 + Excel 解析 + 数据追加 + 去重
 */
export function useSyncRequirements() {
  const { updateRequirements } = useRequirements();
  const { query } = useGemini();
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(
    async ({ scheduleDocPath, prompt }: SyncRequirementsParams) => {
      await showToast({
        style: Toast.Style.Animated,
        title: '正在同步需求...',
        message: '使用 Gemini CLI 解析排期文档',
      });

      try {
        // 1. 构建 Gemini CLI 查询 prompt
        const geminiPrompt = buildGetRequirementsPrompt(scheduleDocPath, prompt);

        // 2. 调用 Gemini CLI 进行解析,使用标准的 RequirementsListSchema
        const parsedRequirements = await query(geminiPrompt, RequirementsSchema);
        if (parsedRequirements.length === 0) {
          await showToast({
            style: Toast.Style.Failure,
            title: '未找到符合条件的需求',
            message: '请检查筛选条件或排期文档内容',
          });
          return;
        }

        // 2.5 格式化 parsedRequirements
        const currentYear = dayjs().year();
        const formattedRequirements: Requirement[] = parsedRequirements.map((req) => ({
          ...req,
          id: req.id || randomUUID(), // AI 未返回 id 时使用 UUID fallback
          deadline: dayjs(`${currentYear}-${req.deadline}`).format('YYYY-MM-DD'), // '10-15' -> '2025-10-15'
          isFinished: req.isFinished ?? false, // 默认为未完成
          worktrees: [], // 初始化空数组
        }));
        
        // 3. 使用 updater 函数进行去重和追加
        await updateRequirements((prev) => {
          // 使用 id 作为唯一键进行去重
          const existingKeys = new Set(prev.map((req) => req.id));
          const newRequirements = formattedRequirements.filter(
            (req) => !existingKeys.has(req.id),
          );
          return [...prev, ...newRequirements];
        });

        // 4. 显示成功通知
        await showToast({
          style: Toast.Style.Success,
          title: '同步完成',
          message: '所有需求已经同步',
        });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: '同步失败',
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [updateRequirements, query, workspaceRoot],
  );
}
