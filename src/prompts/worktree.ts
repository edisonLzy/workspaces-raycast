/**
 * Worktree Prompt 工具函数
 * 提供 AI 生成分支名称的 prompt 构建能力
 */

import { z } from 'zod';

/**
 * 分支名称响应 Schema
 * AI 返回的结构化数据格式
 */
export const BranchNameResponseSchema = z.object({
  branchName: z.string().describe('分支名称格式: <featureType>/<需求ID>/<kebab-case描述>')
});

/**
 * 构建 AI 生成分支名称的 prompt
 *
 * @param requirementName - 需求名称
 * @param requirementId - 需求 ID
 * @param featureType - Feature 类型 (feat/fix)
 * @returns 格式化的提示词
 *
 * @example
 * const prompt = buildBranchNamePrompt('用户登录重构', 'req-123', 'feat');
 * // AI 应返回: { branchName: 'feat/req-123/user-login-refactor' }
 */
export function buildBranchNamePrompt(
  requirementName: string,
  requirementId: string,
  featureType: 'feat' | 'fix',
): string {
  return `根据以下需求信息生成 Git 分支名称:

需求信息:
- 需求名称: ${requirementName}
- 需求 ID: ${requirementId}
- Feature 类型: ${featureType}

要求:
1. 格式必须为: <featureType>/<需求ID>/<需求描述>
2. 需求描述部分使用 kebab-case (小写英文单词 + 连字符)
3. 需求描述要简洁、语义化,不超过 5 个单词
4. 如果需求名称是中文,请翻译成英文
5. 示例: feat/req-123/user-login-refactor

只返回分支名称,不要包含任何解释或额外信息。`;
}
