import { z } from 'zod';

/**
 * ContextInfo Schema
 * 上下文信息类型 - 用于存储文档链接等上下文
 */
export const ContextInfoSchema = z.object({
  type: z.literal('link'), // 后续可能会扩展更多类型
  label: z.string().min(1, '标签不能为空'),
  content: z.string().url('必须是有效的 URL'),
});
