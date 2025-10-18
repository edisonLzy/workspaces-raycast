import { getPreferenceValues } from '@raycast/api';
import { exec } from '../utils/exec';
import type { z } from 'zod';
import type { Preferences } from '../types';

/**
 * Claude Code 集成 Hook
 * 提供结构化查询能力,支持 Zod schema 验证和类型推断
 */
export function useClaudeCode() {
  const { claudeCliPath = 'claude' } = getPreferenceValues<Preferences>();

  /**
   * 向 Claude Code 发送查询并获取结构化响应
   * @param prompt - 用户提示词
   * @param schema - Zod schema 用于验证和类型推断
   * @returns 符合 schema 类型的结构化数据
   * @throws 当 Claude CLI 不可用、超时、响应无效或验证失败时抛出错误
   */
  const query = async <T extends z.ZodType>(
    prompt: string,
    schema: T,
  ): Promise<z.infer<T>> => {
    // 构建 Claude CLI 命令参数
    // 将 schema 转换为可读的描述
    const schemaDescription = JSON.stringify(schema);
    const args = [
      '--print',
      '--output-format', 'json',
      '--system-prompt', `
      You must respond with valid JSON that matches this schema: ${schemaDescription}. 
      Only output the JSON, no markdown code blocks or explanations.`,
      prompt,
    ];

    try {
      // 执行 Claude CLI (10s 超时, 使用 shell 解决 Node.js PATH 问题)
      const output = await exec(claudeCliPath, args, { timeout: 10000, shell: true });

      // 解析 Claude CLI 的响应包装
      let cliResponse: unknown;
      try {
        cliResponse = JSON.parse(output);
      } catch {
        throw new Error(`Claude CLI returned invalid JSON: ${output}`);
      }

      // 提取实际的结果 (Claude CLI 返回的是包含元数据的对象)
      if (
        typeof cliResponse !== 'object' ||
        cliResponse === null ||
        !('result' in cliResponse)
      ) {
        throw new Error('Claude CLI response missing "result" field');
      }

      const resultContent = (cliResponse as { result: string }).result;

      // 尝试解析结果内容为 JSON (Claude 应该返回 JSON 字符串)
      let jsonResponse: unknown;
      try {
        jsonResponse = JSON.parse(resultContent);
      } catch {
        // 如果不是 JSON,可能是纯文本响应,直接使用字符串
        jsonResponse = resultContent;
      }

      // 使用 Zod schema 验证响应
      const validationResult = schema.safeParse(jsonResponse);
      if (!validationResult.success) {
        throw new Error(
          `Claude response validation failed: ${validationResult.error.message}`,
        );
      }

      return validationResult.data;
    } catch (error) {
      // 重新抛出错误,让调用方处理 (Toast/Alert)
      if (error instanceof Error) {
        // 增强错误信息以便调试
        if (error.message.includes('ENOENT')) {
          throw new Error('Claude CLI not found. Please ensure Claude Code is installed.');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Claude CLI request timed out (10s limit).');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while querying Claude CLI.');
    }
  };

  return { query };
}