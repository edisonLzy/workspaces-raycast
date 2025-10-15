import { useCallback } from "react";
import { showToast, Toast } from "@raycast/api";
import * as execUtils from "../utils/exec";

/**
 * Hook: 生成分支名
 * 包含: Claude Code CLI 调用 + 降级处理 + Toast
 */
export function useGenerateBranchName() {
  return useCallback(async (requirementName: string): Promise<string | null> => {
    try {
      // 调用纯工具函数执行 Claude Code 命令
      const branchName = await execUtils.execClaude(
        `Generate a git-safe branch name in kebab-case from: ${requirementName}. Only output the branch name without any explanation or additional text.`,
        { timeout: 10000 },
      );

      const cleaned = branchName.trim();

      // 验证生成的分支名
      if (!cleaned || cleaned.includes(" ") || cleaned.includes("\n")) {
        throw new Error("Generated branch name is invalid");
      }

      return cleaned;
    } catch (error) {
      // 降级处理: 返回 null,由调用方决定是否手动输入
      await showToast({
        style: Toast.Style.Failure,
        title: "Claude Code 不可用",
        message: "请手动输入分支名",
      });
      return null;
    }
  }, []);
}

/**
 * 辅助函数: 将需求名称转换为简单的 kebab-case
 * 用作 Claude Code 不可用时的备选方案
 */
export function convertToKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // 移除特殊字符
    .replace(/\s+/g, "-") // 空格转换为短横线
    .replace(/-+/g, "-") // 多个短横线合并为一个
    .replace(/^-+|-+$/g, ""); // 移除首尾短横线
}
