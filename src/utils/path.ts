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
 * 新目录结构: worktrees/<需求ID>/<仓库名>-<分支名>/
 *
 * @param workspaceRoot - 工作区根目录
 * @param requirementId - 需求 ID
 * @param repository - 仓库名称
 * @param branchName - 分支名称(如 feat/req-123/user-login)
 * @returns 完整的 worktree 路径
 *
 * @example
 * getWorktreePath('~/workspaces', 'req-123', 'user-center', 'feat/req-123/user-login')
 * // => ~/workspaces/worktrees/req-123/user-center-feat-req-123-user-login
 */
export function getWorktreePath(
  workspaceRoot: string,
  requirementId: string,
  repository: string,
  branchName: string,
): string {
  const expandedRoot = expandTilde(workspaceRoot);
  // 将分支名中的 / 替换为 - (如 feat/req-123/login => feat-req-123-login)
  const dirName = `${repository}-${branchName.replace(/\//g, '-')}`;
  return path.join(expandedRoot, 'worktrees', requirementId, dirName);
}

/**
 * 从路径中提取仓库名称
 * 纯函数: 提取路径的最后一级目录名
 *
 * @param repoPath - 仓库的完整路径
 * @returns 仓库名称(最后一级目录名)
 *
 * @example
 * extractRepoName('/Users/zhiyu/Projects/user-center')
 * // => 'user-center'
 */
export function extractRepoName(repoPath: string): string {
  return path.basename(repoPath);
}

/**
 * 规范化路径
 * 纯函数: 路径规范化
 */
export function normalizePath(filePath: string): string {
  return path.normalize(expandTilde(filePath));
}
