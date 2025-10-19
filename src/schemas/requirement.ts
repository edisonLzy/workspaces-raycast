import { z } from 'zod';
import { ContextInfoSchema } from './context';
import { WorktreeInfoSchema } from './worktree';

/**
 * 需求 Schema (完整版 - 对应 types.ts 中的 Requirement 接口)
 * 用于存储在 requirements.json 中的完整需求数据
 */
export const RequirementSchema = z.object({
  id: z.string().describe(`
需求 ID (从 KeOnes 链接中提取)

示例:
- 输入: https://{host}/project/requirement/50505689
- 输出: 50505689`), // 需求id 从 KeOnes URL 中提取
  iteration: z
    .string()
    .describe('需求所属的迭代. e.g 7.19'),
  name: z
    .string()
    .min(2, '需求名称至少 2 个字符')
    .max(100, '需求名称最多 100 个字符'), // 需求名称
  deadline: z.string().describe('提测时间 (日期格式 MM-DD, 如 10-15)'), // 需求提测时间
  isFinished: z.boolean().default(false).describe('需求是否已完成'), // 完成状态
  context: z.array(ContextInfoSchema).default([]), // 上下文信息
  worktrees: z.array(WorktreeInfoSchema).optional(), // 关联的 worktree 信息
});

/**
 * 需求列表 Schema (用于同步)
 */
export const RequirementsSchema = z.array(RequirementSchema);
