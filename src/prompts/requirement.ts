/**
 * 需求管理相关 Prompt 工具函数
 * 提供需求数据同步、解析等业务场景的 prompt 模板
 */

/**
 * 构建获取需求数据提示词
 *
 * 用于从 Excel 排期文档中提取需求数据的 Gemini CLI 查询 prompt。
 * 该 prompt 会指示 AI 使用 xlsx MCP 工具解析 Excel 文件,并根据用户筛选条件提取需求。
 *
 * @param scheduleDocPath - Excel 排期文档的绝对路径
 * @param userFilter - 用户定义的筛选条件描述 (例如: "本周需求", "24.10.1 迭代")
 * @returns 用于 Gemini CLI 的完整提示词
 *
 * @example
 * const prompt = buildGetRequirementsPrompt(
 *   '/path/to/schedule.xlsx',
 *   '24.10.1 迭代的所有需求'
 * );
 * // 输出:
 * // "请使用 xlsx mcp 根据用户筛选条件提取 排期文档中的数据
 * // 文件路径: /path/to/schedule.xlsx
 * // 用户的筛选条件: 24.10.1 迭代的所有需求"
 */
export function buildGetRequirementsPrompt(
  scheduleDocPath: string,
  userFilter: string,
): string {
  return `
请使用 xlsx mcp 根据用户筛选条件提取 排期文档中的数据
文件路径: ${scheduleDocPath}
用户的筛选条件: ${userFilter}
`;
}
