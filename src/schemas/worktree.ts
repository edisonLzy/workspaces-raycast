import { z } from 'zod';

/**
 * WorktreeInfo Schema
 * Worktree 信息 - 包含 Git worktree 的完整元数据
 */
export const WorktreeInfoSchema = z.object({
  label: z.string().min(1, 'Worktree 标签不能为空'), // worktree label
  path: z.string().min(1, 'Worktree 路径不能为空'), // worktree 绝对路径
  branch: z.string().min(1, '分支名称不能为空'), // 分支名称
  repository: z.string().min(1, '仓库名称不能为空'), // 所属仓库
});
