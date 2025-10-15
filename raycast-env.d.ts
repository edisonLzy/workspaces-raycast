/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

type ExtensionPreferences = {
  /** 工作目录根路径 - 存储 worktrees 和 requirements.json 的统一目录 */
  'workspaceRoot': string;
};

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences;

declare namespace Preferences {
  /** Preferences accessible in the `view-requirements` command */
  export type ViewRequirements = ExtensionPreferences & Record<string, never>;
}

declare namespace Arguments {
  /** Arguments passed to the `view-requirements` command */
  export type ViewRequirements = Record<string, never>;
}
