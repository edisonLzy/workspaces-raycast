/* eslint-disable @typescript-eslint/consistent-type-imports */
// 注意: 需要导入 schema 值(非 type)才能使用 z.infer<typeof Schema>
import { z } from 'zod';
import { ContextInfoSchema } from './schemas/context';
import { WorktreeInfoSchema } from './schemas/worktree';
import { RequirementSchema, RequirementsSchema } from './schemas/requirement';

/**
 * TypeScript 类型定义 - 从 Zod schemas 推导
 */
export type ContextInfo = z.infer<typeof ContextInfoSchema>;

export type WorktreeInfo = z.infer<typeof WorktreeInfoSchema>;

export type Requirement = z.infer<typeof RequirementSchema>;

export type Requirements = z.infer<typeof RequirementsSchema>;

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
  claudeCliPath?: string; // Claude CLI 路径
  geminiCliPath?: string; // Gemini CLI 路径
}
