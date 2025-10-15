import { useExec } from "@raycast/utils";
import { useCallback } from "react";
import * as execUtils from "../utils/exec";

/**
 * Git worktree 信息
 */
export interface GitWorktree {
  path: string;
  branch: string;
}

/**
 * Hook: 检查是否为 Git 仓库
 */
export function useIsGitRepository(repoPath: string | undefined) {
  return useExec("git", ["rev-parse", "--is-inside-work-tree"], {
    cwd: repoPath,
    execute: !!repoPath,
    onError: () => {
      // 忽略错误,通过返回值判断
    },
  });
}

/**
 * Hook: 获取仓库根目录
 */
export function useRepoRoot(startPath: string | undefined) {
  return useExec("git", ["rev-parse", "--show-toplevel"], {
    cwd: startPath,
    execute: !!startPath,
    parseOutput: ({ stdout }) => stdout.trim(),
  });
}

/**
 * Hook: 列出所有 worktree
 * 包含: 命令执行 + 输出解析逻辑
 */
export function useListWorktrees(repoPath: string | undefined) {
  return useExec("git", ["worktree", "list", "--porcelain"], {
    cwd: repoPath,
    execute: !!repoPath,
    parseOutput: ({ stdout }) => {
      // 解析逻辑高内聚在 Hook 中
      const worktrees: GitWorktree[] = [];
      const lines = stdout.split("\n");
      let current: { path?: string; branch?: string } = {};

      for (const line of lines) {
        if (line.startsWith("worktree ")) {
          current.path = line.substring("worktree ".length);
        } else if (line.startsWith("branch ")) {
          current.branch = line.substring("branch ".length).replace("refs/heads/", "");
        } else if (line === "" && current.path && current.branch) {
          worktrees.push({ path: current.path, branch: current.branch });
          current = {};
        }
      }

      // 处理最后一个 worktree (如果没有尾随空行)
      if (current.path && current.branch) {
        worktrees.push({ path: current.path, branch: current.branch });
      }

      return worktrees;
    },
  });
}

/**
 * Hook: 检查分支是否存在
 */
export function useBranchExists(repoPath: string | undefined, branchName: string | undefined) {
  return useExec("git", ["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], {
    cwd: repoPath,
    execute: !!repoPath && !!branchName,
    onError: () => {
      // 分支不存在时会报错,这是预期行为
    },
  });
}

/**
 * 同步函数: 检查分支是否存在
 */
export async function checkBranchExists(repoPath: string, branchName: string): Promise<boolean> {
  try {
    await execUtils.execGit(["show-ref", "--verify", "--quiet", `refs/heads/${branchName}`], {
      cwd: repoPath,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 同步函数: 获取仓库根目录
 */
export async function getRepoRoot(startPath: string): Promise<string> {
  const output = await execUtils.execGit(["rev-parse", "--show-toplevel"], {
    cwd: startPath,
  });
  return output.trim();
}

/**
 * Hook: 验证 Git 分支名
 */
export function useValidateBranchName() {
  return useCallback((branchName: string): { valid: boolean; message?: string } => {
    // Git 分支名规则
    if (branchName.length === 0) {
      return { valid: false, message: "分支名不能为空" };
    }

    if (branchName.startsWith("-")) {
      return { valid: false, message: "分支名不能以 - 开头" };
    }

    if (branchName.includes("..")) {
      return { valid: false, message: "分支名不能包含 .." };
    }

    if (branchName.includes(" ")) {
      return { valid: false, message: "分支名不能包含空格" };
    }

    if (/[~^:?*\[\]\\]/.test(branchName)) {
      return { valid: false, message: "分支名包含非法字符" };
    }

    return { valid: true };
  }, []);
}
