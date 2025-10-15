import path from 'path';
import os from 'os';

/**
 * 展开 ~ 为用户主目录
 * 纯函数: 简单字符串处理
 */
export function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

/**
 * 获取数据文件路径
 * 纯函数: 路径拼接,无业务逻辑
 */
export function getDataFilePath(workspaceRoot: string): string {
  const expandedRoot = expandTilde(workspaceRoot);
  return path.join(expandedRoot, 'requirements.json');
}

/**
 * 获取 worktree 路径
 * 纯函数: 路径拼接
 */
export function getWorktreePath(
  workspaceRoot: string,
  branchName: string,
): string {
  const expandedRoot = expandTilde(workspaceRoot);
  return path.join(expandedRoot, branchName);
}

/**
 * 规范化路径
 * 纯函数: 路径规范化
 */
export function normalizePath(filePath: string): string {
  return path.normalize(expandTilde(filePath));
}
