/**
 * 通用 Prompt 工具函数
 * 提供跨 AI 服务的统一 prompt 构建能力
 */

import { z } from 'zod';

/**
 * 构建结构化输出提示词(统一 Claude/Gemini 两种格式)
 *
 * @param schema - Zod schema 对象,将自动转换为 JSON Schema
 * @param options.format - 输出格式选项
 *   - 'json': 要求 AI 返回纯 JSON,不带 markdown 包裹 (Claude Code CLI)
 *   - 'markdown': 要求 AI 返回 JSON 包裹在 ```json code block 中 (Gemini CLI)
 * @returns 格式化的系统提示词,包含 schema 和输出格式要求
 *
 * @example
 * // Claude Code CLI 使用
 * import { z } from 'zod';
 * const mySchema = z.object({ name: z.string() });
 * const claudePrompt = buildStructuralOutputPrompt(mySchema, { format: 'json' });
 * // 输出: "You must respond with valid JSON that matches this schema: {...}. Only output the JSON, no markdown code blocks or explanations."
 *
 * @example
 * // Gemini CLI 使用
 * const geminiPrompt = buildStructuralOutputPrompt(mySchema, { format: 'markdown' });
 * // 输出: "You must respond with valid JSON wrapped in a markdown code block:\n```json\n<your JSON here>\n```\n\nSchema:\n{...}"
 */
export function buildStructuralOutputPrompt<T extends z.ZodType>(
  schema: T,
): string {
  // 将 Zod schema 转换为标准 JSON Schema
  const jsonSchema = z.toJSONSchema(schema);
  const schemaStr = JSON.stringify(jsonSchema, null, 2);

  // Gemini CLI 格式: JSON 包裹在 markdown code block 中
  return `
You must respond with valid JSON wrapped in a markdown code block:

\`\`\`json
<your JSON here>
\`\`\`

Schema:
${schemaStr}`;
}
