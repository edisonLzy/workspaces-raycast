/**
 * 上下文信息类型
 */
export interface ContextInfo {
  type: "link"; // 后续可能会扩展更多类型
  label: string;
  content: string;
}

/**
 * Worktree 信息
 */
export interface WorktreeInfo {
  label: string; // worktree label
  path: string; // worktree 绝对路径
  branch: string; // 分支名称
  repository: string; // 所属仓库
}

/**
 * 需求信息
 */
export interface Requirement {
  id: string; // 需求id
  iteration: string; // 迭代版本 (e.g., "24.10.1")
  name: string; // 需求名称
  deadline: number; // 需求提测时间 (Unix 时间戳毫秒)
  context: ContextInfo[]; // 上下文信息(e.g., PRD 文档,TRD 文档链接 等)
  worktrees?: WorktreeInfo[]; // 关联的 worktree 信息
}

/**
 * 数据文件格式
 */
export interface RequirementsData {
  version: string; // 数据格式版本
  requirements: Requirement[];
  lastSyncAt?: string; // 最后同步时间
}

/**
 * Raycast Extension Preferences
 */
export interface Preferences {
  workspaceRoot: string; // 工作目录根路径
}
