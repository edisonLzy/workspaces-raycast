import { z } from 'zod';

/**
 * Context 信息 Schema
 */
export const ContextInfoSchema = z.object({
  type: z.literal('link'),
  label: z.string(),
  content: z.string(), // URL validation will be done at runtime
});

/**
 * 需求 Schema (用于验证 Claude Code 返回的数据)
 * 用于从排期文档同步需求时的数据验证
 */
export const RequirementSchema = z.object({
  iteration: z.string().describe('迭代号码'),
  name: z.string().min(2, '需求名称至少 2 个字符').max(100, '需求名称最多 100 个字符'),
  deadline: z.number().int().positive('截止日期必须是有效的 Unix 时间戳'),
  context: z.array(ContextInfoSchema).default([]),
});

/**
 * 需求列表 Schema
 */
export const RequirementsListSchema = z.array(RequirementSchema);

export type RequirementSchemaType = z.infer<typeof RequirementSchema>;
