import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { inspect } from 'node:util';
import dayjs from 'dayjs';

/**
 * 日志工具
 * 将错误信息写入到项目根目录的 logs 文件夹中
 */

// 获取项目根目录 (假设当前文件在 src/utils/)
const projectRoot = join(__dirname, '../..');
const logsDir = join(projectRoot, 'logs');

/**
 * 确保 logs 目录存在
 */
function ensureLogsDir() {
  try {
    mkdirSync(logsDir, { recursive: true });
  } catch {
    // 忽略目录已存在的错误
  }
}

/**
 * 生成日志文件名
 * @param prefix - 文件名前缀 (如 'error', 'sync')
 * @returns 日志文件完整路径
 * @example
 * generateLogFilename('error') // logs/error-2025-10-19-23-15-30.log
 */
function generateLogFilename(prefix: string): string {
  const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss');
  return join(logsDir, `${prefix}-${timestamp}.log`);
}

/**
 * 格式化错误对象为可读字符串
 * @param error - 错误对象
 * @returns 格式化后的错误信息
 */
function formatError(error: unknown): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push(`时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  lines.push('='.repeat(80));
  lines.push('');

  if (error instanceof Error) {
    lines.push(`错误类型: ${error.constructor.name}`);
    lines.push(`错误消息: ${error.message}`);
    lines.push('');
    lines.push('错误堆栈:');
    lines.push(error.stack || '(无堆栈信息)');
    lines.push('');
    lines.push('完整错误对象 (JSON):');
    try {
      lines.push(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch {
      lines.push('(无法序列化为 JSON)');
    }
  } else {
    lines.push(`错误类型: ${typeof error}`);
    lines.push('');
    lines.push('错误详情 (inspect):');
    lines.push(inspect(error, {
      depth: 20,
      maxArrayLength: 200,
      maxStringLength: 5000,
      breakLength: 100,
      compact: false,
      sorted: true,
    }));
  }

  lines.push('');
  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * 记录错误日志到文件
 * @param error - 错误对象
 * @param context - 错误上下文 (可选)
 * @returns 日志文件路径
 */
export function logError(error: unknown, context?: string): string {
  ensureLogsDir();

  const logContent = formatError(error);
  const contextInfo = context ? `\n上下文: ${context}\n` : '';
  const fullContent = contextInfo + logContent;

  const logFile = generateLogFilename('error');

  try {
    writeFileSync(logFile, fullContent, 'utf-8');
    console.error(`错误日志已写入: ${logFile}`);
    return logFile;
  } catch (writeError) {
    console.error('写入日志文件失败:', writeError);
    console.error('原始错误:', error);
    return '';
  }
}

/**
 * 记录同步日志到文件
 * @param data - 日志数据
 * @param label - 日志标签
 * @returns 日志文件路径
 */
export function logSync(data: unknown, label: string = 'sync'): string {
  ensureLogsDir();

  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push(`时间: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
  lines.push(`标签: ${label}`);
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(inspect(data, {
    depth: 20,
    maxArrayLength: 200,
    maxStringLength: 5000,
    breakLength: 100,
    compact: false,
    sorted: true,
  }));
  lines.push('');
  lines.push('='.repeat(80));

  const logFile = generateLogFilename(label);

  try {
    writeFileSync(logFile, lines.join('\n'), 'utf-8');
    console.log(`日志已写入: ${logFile}`);
    return logFile;
  } catch (writeError) {
    console.error('写入日志文件失败:', writeError);
    return '';
  }
}
