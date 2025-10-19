import { getPreferenceValues } from '@raycast/api';
import { exec } from '../utils/exec';
import { buildStructuralOutputPrompt } from '../prompts/common';
import type { z } from 'zod';
import type { Preferences } from '../types';

/**
 * Gemini CLI 集成 Hook
 * 提供结构化查询能力,支持 Zod schema 验证和类型推断
 */
export function useGemini() {
  const { geminiCliPath = 'gemini', workspaceRoot } = getPreferenceValues<Preferences>();

  /**
   * 向 Gemini CLI 发送查询并获取结构化响应
   * @param prompt - 用户提示词
   * @param schema - Zod schema 用于验证和类型推断
   * @returns 符合 schema 类型的结构化数据
   * @throws 当 Gemini CLI 不可用、超时、响应无效或验证失败时抛出错误
   */
  const query = async <T extends z.ZodType>(
    prompt: string,
    schema: T,
  ): Promise<z.infer<T>> => {
    // 构建 Gemini CLI 命令参数
    const fullPrompt = `
    ${prompt}
    ${buildStructuralOutputPrompt(schema)}
    `;

    const args = [
      '-p', fullPrompt,
      '--yolo'
    ];

    try {
      // 执行 Gemini CLI (无超时限制,支持处理大型 Excel 文件)
      // 不使用 shell 以避免转义问题,直接通过 execFile 传递参数
      const output = await exec(geminiCliPath, args, {
        cwd: workspaceRoot,
      });

      // 尝试提取 markdown code block (优先)
      // 支持 ```json 或 ``` 两种格式
      const codeBlockMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonResponse: unknown;

      if (codeBlockMatch) {
        // 从 markdown code block 中提取 JSON
        try {
          jsonResponse = JSON.parse(codeBlockMatch[1]);
        } catch (parseError) {
          throw new Error(
            `Failed to parse JSON from markdown code block: ${parseError instanceof Error ? parseError.message : String(parseError)}\n\nExtracted content:\n${codeBlockMatch[1]}`,
          );
        }
      } else {
        // Fallback: 尝试直接解析整个输出 (可能是裸 JSON)
        try {
          jsonResponse = JSON.parse(output);
        } catch {
          throw new Error(`Gemini CLI returned invalid response: ${output}`);
        }
      }

      // 使用 Zod schema 验证响应
      const validationResult = schema.safeParse(jsonResponse);
      if (!validationResult.success) {
        // 构建详细的错误信息
        const errorDetails = validationResult.error.issues
          .map((issue) => `  - ${issue.path.join('.') || 'root'}: ${issue.message}`)
          .join('\n');

        throw new Error(
          `Gemini response validation failed:\n${errorDetails}\n\nReceived data:\n${JSON.stringify(jsonResponse, null, 2)}`,
        );
      }

      return validationResult.data;
    } catch (error) {
      // 重新抛出错误,让调用方处理 (Toast/Alert)
      if (error instanceof Error) {
        // 增强错误信息以便调试
        if (error.message.includes('ENOENT')) {
          throw new Error('Gemini CLI not found. Please ensure Gemini CLI is installed.');
        }
        if (error.message.includes('timeout') || error.message.includes('SIGTERM')) {
          throw new Error('Gemini CLI 请求超时 (60秒限制)。请尝试缩小查询范围或减小文件大小。');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while querying Gemini CLI.');
    }
  };

  return { query };
}
