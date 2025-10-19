import fs from 'fs/promises';
import path from 'path';

/**
 * 读取 JSON 文件
 * 纯函数: 不包含任何业务逻辑,不处理错误(由调用方处理)
 */
export async function readJSON<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');

  // 处理空文件或只有空白字符的文件
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error(`File is empty: ${filePath}`);
  }

  try {
    return JSON.parse(trimmedContent);
  } catch (error) {
    // 增强错误信息，包含文件路径和部分内容
    const preview = trimmedContent.slice(0, 100);
    throw new Error(
      `Failed to parse JSON from ${filePath}: ${error instanceof Error ? error.message : String(error)}\nContent preview: ${preview}${trimmedContent.length > 100 ? '...' : ''}`,
    );
  }
}

/**
 * 写入 JSON 文件
 * 纯函数: 不包含 Toast,不处理错误
 */
export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * 检查文件或目录是否存在
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}
