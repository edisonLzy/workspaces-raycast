import { useCallback } from "react";
import { showToast, Toast, open } from "@raycast/api";
import * as execUtils from "../utils/exec";

/**
 * Hook: 打开编辑器
 * 包含: 执行 + Toast 反馈
 */
export function useOpenInEditor() {
  return useCallback(async (path: string) => {
    try {
      await execUtils.execOpen(path);
      await showToast({ style: Toast.Style.Success, title: "已打开" });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "打开失败",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, []);
}

/**
 * Hook: 在 Finder 中显示
 * 包含: 执行 + Toast 反馈
 */
export function useShowInFinder() {
  return useCallback(async (path: string) => {
    try {
      await open(path);
      await showToast({ style: Toast.Style.Success, title: "已在 Finder 中显示" });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "打开失败",
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, []);
}
