import { randomUUID } from 'node:crypto';
import { useCallback } from 'react';
import { showToast, Toast, getPreferenceValues } from '@raycast/api';
import { RequirementsListSchema } from '../schemas/requirement';
import * as fsUtils from '../utils/fs';
import * as pathUtils from '../utils/path';
import { useGemini } from './useGemini';
import { useRequirements } from './useRequirements';
import type { RequirementsData, Preferences, Requirement } from '../types';

export interface SyncRequirementsParams {
  scheduleDocPath: string; // Excel 文件路径
  prompt: string; // 用户自定义筛选条件
}

/**
 * Hook: 从排期文档同步需求
 * 包含: Gemini CLI 集成 + Excel 解析 + 数据追加 + 去重
 */
export function useSyncRequirements() {
  const { mutate } = useRequirements();
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
        const geminiPrompt = `
请使用 mcp__xlsx-mcp__get-records-from-sheet 根据用户筛选条件提取 排期文档中的数据
文件路径: ${scheduleDocPath}

然后根据用户的筛选条件提取需求数据:
${prompt}

请返回符合以下 JSON Schema 的需求列表:
- iteration: 迭代版本
- name: 需求名称 (2-100 字符)
- deadline: 截止日期 (Unix 时间戳,毫秒)
- context: 上下文链接数组,每个元素包含:
  - type: 固定为 "link"
  - label: 链接标签 (如 "PRD", "TRD", "设计稿")
  - content: URL 地址

只返回 JSON 数组,不要包含任何其他内容。
        `.trim();

        // 2. 调用 Gemini CLI 进行解析
        const parsedRequirements = await query(geminiPrompt, RequirementsListSchema);

        if (parsedRequirements.length === 0) {
          await showToast({
            style: Toast.Style.Failure,
            title: '未找到符合条件的需求',
            message: '请检查筛选条件或排期文档内容',
          });
          return;
        }

        // 3. 读取现有需求数据
        const filePath = pathUtils.getDataFilePath(workspaceRoot);
        let existingData: RequirementsData;
        try {
          existingData = await fsUtils.readJSON<RequirementsData>(filePath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            // 文件不存在,创建初始数据结构
            existingData = {
              version: '1.0',
              requirements: [],
            };
          } else {
            throw error;
          }
        }

        // 4. 去重并追加新需求
        const existingKeys = new Set(
          existingData.requirements.map((req) => `${req.iteration}-${req.name}`),
        );

        const newRequirements: Requirement[] = [];
        for (const req of parsedRequirements) {
          const key = `${req.iteration}-${req.name}`;
          if (!existingKeys.has(key)) {
            newRequirements.push({
              id: randomUUID(),
              iteration: req.iteration,
              name: req.name,
              deadline: req.deadline,
              context: req.context,
              worktrees: [], // 初始化空的 worktrees 数组
            });
          }
        }

        if (newRequirements.length === 0) {
          await showToast({
            style: Toast.Style.Success,
            title: '同步完成',
            message: '所有需求已存在,无需追加',
          });
          return;
        }

        // 5. 保存数据
        existingData.requirements.push(...newRequirements);
        existingData.lastSyncAt = new Date().toISOString();
        await fsUtils.writeJSON(filePath, existingData);

        // 6. 刷新缓存
        await mutate();

        // 7. 显示成功通知
        await showToast({
          style: Toast.Style.Success,
          title: '同步成功',
          message: `已追加 ${newRequirements.length} 个新需求`,
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
    [mutate, query, workspaceRoot],
  );
}
