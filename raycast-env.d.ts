/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** 工作目录根路径 - 存储 worktrees 和 requirements.json 的统一目录 */
  "workspaceRoot": string,
  /** Claude CLI 路径 - Claude Code CLI 的完整路径 (例如: /usr/local/bin/claude 或 /opt/homebrew/bin/claude) */
  "claudeCliPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `requirements` command */
  export type Requirements = ExtensionPreferences & {}
  /** Preferences accessible in the `test-claude-code` command */
  export type TestClaudeCode = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `requirements` command */
  export type Requirements = {}
  /** Arguments passed to the `test-claude-code` command */
  export type TestClaudeCode = {}
}

