import { z } from 'zod';

/**
 * WorktreeInfo Schema
 * Worktree 信息 - 包含 Git worktree 的完整元数据
 */
export const WorktreeInfoSchema = z.object({
  baseBranch: z.string().min(1, '基线分支不能为空'), // 基线分支(如 master)
  branch: z.string().min(1, '分支名称不能为空'), // 分支名称
  featureType: z.enum(['feat', 'fix'], {
    message: 'Feature 类型必须为 feat 或 fix',
  }), // Feature 类型
  path: z.string().min(1, 'Worktree 路径不能为空'), // worktree 绝对路径
  repository: z.string().min(1, '仓库名称不能为空'), // 所属仓库
});
