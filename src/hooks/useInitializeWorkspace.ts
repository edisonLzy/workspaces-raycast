import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { useCallback } from 'react';
import { showToast, Toast, getPreferenceValues } from '@raycast/api';
import * as fsUtils from '../utils/fs';
import * as pathUtils from '../utils/path';
import type { Preferences, RequirementsData } from '../types';

export interface InitializationItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  created: boolean; // true = 新创建, false = 已存在
}

export interface InitializationResult {
  success: boolean;
  items: InitializationItem[];
  workspaceRoot: string;
}

/**
 * Hook: 初始化工作目录
 * 创建必要的文件和目录:
 * - requirements.json (需求数据)
 * - .mcp.json (MCP server 配置)
 * - .gemini/settings.json (Gemini CLI 配置)
 * - worktrees/ (git worktrees 目录)
 */
export function useInitializeWorkspace() {
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(async (): Promise<InitializationResult> => {
    await showToast({
      style: Toast.Style.Animated,
      title: '正在初始化工作目录...',
    });

    const items: InitializationItem[] = [];

    try {
      // 1. 创建 requirements.json
      const requirementsPath = pathUtils.getDataFilePath(workspaceRoot);
      const requirementsExists = existsSync(requirementsPath);

      if (!requirementsExists) {
        const initialData: RequirementsData = {
          version: '1.0',
          requirements: [],
        };
        await fsUtils.writeJSON(requirementsPath, initialData);
      }

      items.push({
        name: 'requirements.json',
        path: requirementsPath,
        type: 'file',
        created: !requirementsExists,
      });

      // 2. 创建 .mcp.json
      const mcpConfigPath = join(workspaceRoot, '.mcp.json');
      const mcpConfigExists = existsSync(mcpConfigPath);

      if (!mcpConfigExists) {
        const mcpConfig = {
          mcpServers: {
            'xlsx-mcp': {
              command: 'npx',
              args: ['-y', '@codemons/mcp-servers', 'xlsx-mcp'],
            },
          },
        };
        await fsUtils.writeJSON(mcpConfigPath, mcpConfig);
      }

      items.push({
        name: '.mcp.json',
        path: mcpConfigPath,
        type: 'file',
        created: !mcpConfigExists,
      });

      // 3. 创建 .gemini 目录和 settings.json
      const geminiDir = join(workspaceRoot, '.gemini');
      const geminiDirExists = existsSync(geminiDir);

      if (!geminiDirExists) {
        mkdirSync(geminiDir, { recursive: true });
      }

      items.push({
        name: '.gemini/',
        path: geminiDir,
        type: 'directory',
        created: !geminiDirExists,
      });

      const geminiSettingsPath = join(geminiDir, 'settings.json');
      const geminiSettingsExists = existsSync(geminiSettingsPath);

      if (!geminiSettingsExists) {
        const geminiSettings = {
          mcpServers: {
            'xlsx-mcp': {
              command: 'npx',
              args: ['-y', '@codemons/mcp-servers', 'xlsx-mcp'],
            },
          },
        };
        await fsUtils.writeJSON(geminiSettingsPath, geminiSettings);
      }

      items.push({
        name: '.gemini/settings.json',
        path: geminiSettingsPath,
        type: 'file',
        created: !geminiSettingsExists,
      });

      // 4. 创建 worktrees 目录
      const worktreesDir = join(workspaceRoot, 'worktrees');
      const worktreesDirExists = existsSync(worktreesDir);

      if (!worktreesDirExists) {
        mkdirSync(worktreesDir, { recursive: true });
      }

      items.push({
        name: 'worktrees/',
        path: worktreesDir,
        type: 'directory',
        created: !worktreesDirExists,
      });

      // 统计创建数量
      const createdCount = items.filter((item) => item.created).length;
      const existingCount = items.length - createdCount;

      await showToast({
        style: Toast.Style.Success,
        title: '工作目录初始化成功',
        message: `创建了 ${createdCount} 项，${existingCount} 项已存在`,
      });

      return {
        success: true,
        items,
        workspaceRoot,
      };
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: '初始化失败',
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }, [workspaceRoot]);
}
