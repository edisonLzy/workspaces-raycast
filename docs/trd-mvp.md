### **技术设计文档 (TRD): "Workspaces Manager" MVP 版本**

| **版本** | **日期** | **作者** | **状态** |
| :--- | :--- | :--- | :--- |
| 2.0 | 2025-10-14 | Tech Lead | 简化版 |
| 2.1 | 2025-10-14 | Tech Lead | 更新数据模型 |
| 2.2 | 2025-10-14 | Tech Lead | Claude Code 集成 |
| 2.3 | 2025-10-14 | Tech Lead | 架构简化 |
| 2.4 | 2025-10-14 | Tech Lead | Hook-First 架构 |
| 2.5 | 2025-10-14 | Tech Lead | 高内聚设计 |

**版本 2.5 变更**:
- **Utils Layer 纯化**: 将业务逻辑完全移至 Hooks Layer
  - `utils/fs.ts`: 纯文件系统操作 (readJSON, writeJSON, ensureDir)
  - `utils/exec.ts`: 纯命令执行封装 (execGit, execClaude, execOpen)
  - `utils/path.ts`: 纯路径处理工具 (getDataFilePath, expandTilde)
  - 移除所有 Toast 提示、错误处理等业务逻辑
- **Hooks Layer 高内聚**: 包含完整业务流程
  - `hooks/useRequirements.ts`: 需求数据 CRUD + 文件 I/O + 数据转换 + Toast
  - `hooks/useGitOperations.ts`: Git worktree 写操作 + 验证 + Toast + 数据更新
  - `hooks/useGitRepository.ts`: Git 状态查询 + 输出解析
  - `hooks/useClaudeCode.ts`: Claude Code 集成 + 降级处理 + Toast
  - `hooks/useEditor.ts`: 编辑器操作 + Toast
- **设计原则**: Utils 是"怎么做", Hooks 是"做什么 + 怎么处理结果"
- **可维护性提升**: 修改业务逻辑只需改 Hooks,Utils 可跨项目复用

**版本 2.4 变更**:
- **Hook-First 架构**: 完全移除 Services Layer,使用纯 Hooks + Utils 模式
- **Hooks Layer 重构**:
  - `useRequirements`: 需求数据 CRUD (替代 DataService)
  - `useGitRepository`: Git 状态管理
  - `useClaudeCode`: Claude Code 集成
  - 使用 `useCachedPromise`/`usePromise`/`useExec` 自动管理状态
- **Utils Layer**: 纯函数工具层
  - `utils/requirements.ts`: 文件 I/O 操作
  - `utils/git.ts`: Git 命令执行
  - `utils/claude.ts`: Claude Code CLI
  - `utils/editor.ts`: 编辑器操作
- **组件模式**: 在 Commands 中组合使用 Hooks + Utils
- **开发时间优化**: 从 6.5 天降至 6 天

**版本 2.3 变更**:
- **架构简化**: Services Layer 仅保留 DataService
- **新增 Utils Layer**: 将原 Service 模块改为纯函数工具
  - `utils/git.ts`: Git 操作工具函数
  - `utils/claude.ts`: Claude Code 集成
  - `utils/editor.ts`: 编辑器工具
- **新增 Hooks Layer**: React Hooks 用于状态管理
  - `hooks/useGitRepository.ts`: Git 相关 Hooks
- **组件设计**: 在 Command 组件中组合使用 Services/Utils/Hooks
- **开发时间优化**: 从 7 天降至 6.5 天

**版本 2.2 变更**:
- 移除 NamingService 模块
- 新增 Claude Code Integration 模块用于分支命名
- 更新系统架构图,将 NamingService 替换为 Claude Code Integration
- 更新错误处理策略,增加 Claude Code 相关错误处理
- 更新开发时间估算（7 天）
- 更新风险与缓解措施

**版本 2.1 变更**:
- 重构 `Requirement` 接口:
  - 移除 `repository`, `prdLink`, `trdLink`, `keynoteLink`, `createdAt`, `updatedAt` 字段
  - 新增 `deadline` (Unix 时间戳) 和 `context` (ContextInfo 数组)
- 新增 `ContextInfo` 接口: 统一管理各类上下文信息（文档链接等）
- 更新 `WorktreeInfo` 接口: 新增 `label` 字段,移除 `createdAt` 字段
- 保留 `RequirementsData` 用于文件格式版本管理

---

## **1. 技术架构概览**

### **1.1 技术栈**

```json
{
  "runtime": "Node.js 22+",
  "framework": "Raycast Extensions API v1.103+",
  "language": "TypeScript 5.x",
  "react": "React 19",
  "dependencies": {
    "@raycast/api": "^1.103.0",
    "@raycast/utils": "^1.17.0"
  }
}
```

### **1.2 系统架构**

```
┌─────────────────────────────────────────────────────────────┐
│                     Raycast Extension                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │            Commands Layer                    │            │
│  │  - view-requirements.tsx                     │            │
│  │  - add-requirement.tsx                       │            │
│  │  (组合使用 Hooks)                            │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │         Hooks Layer (业务逻辑高内聚)          │            │
│  │  ┌───────────────────────────────────────┐ │            │
│  │  │ useRequirements                       │ │            │
│  │  │  - 文件 I/O + 数据转换 + Toast        │ │            │
│  │  │  - 加载/保存/分组逻辑                  │ │            │
│  │  └───────────────────────────────────────┘ │            │
│  │  ┌───────────────────────────────────────┐ │            │
│  │  │ useGitOperations                      │ │            │
│  │  │  - worktree 创建/删除                  │ │            │
│  │  │  - 验证 + 执行 + Toast + 数据更新     │ │            │
│  │  └───────────────────────────────────────┘ │            │
│  │  ┌───────────────────────────────────────┐ │            │
│  │  │ useGitRepository                      │ │            │
│  │  │  - Git 状态查询 + 输出解析            │ │            │
│  │  └───────────────────────────────────────┘ │            │
│  │  ┌───────────────────────────────────────┐ │            │
│  │  │ useClaudeCode / useEditor             │ │            │
│  │  │  - Claude CLI / 编辑器 + Toast        │ │            │
│  │  └───────────────────────────────────────┘ │            │
│  │  (使用 usePromise/useCachedPromise/useExec) │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │         Utils Layer (纯工具函数)              │            │
│  │  - fs.ts      (readJSON, writeJSON)         │            │
│  │  - exec.ts    (execGit, execClaude, execOpen)│            │
│  │  - path.ts    (getDataFilePath, expandTilde)│            │
│  │  (零业务逻辑,可跨项目复用)                   │            │
│  └─────────────────────────────────────────────┘            │
│           │                                                   │
│           ▼                                                   │
│  ┌─────────────────────────────────────────────┐            │
│  │         System Layer                         │            │
│  │  - File System (requirements.json)           │            │
│  │  - Shell Commands (git, claude, open)        │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**架构说明**:
- **Commands Layer**: React 组件,组合使用 Hooks
- **Hooks Layer**: 业务逻辑高内聚层
  - 包含完整业务流程: 验证 → 执行 → Toast → 数据更新
  - 使用 `@raycast/utils` 的 Hooks 自动管理状态
  - 调用 Utils 层的纯函数完成底层操作
- **Utils Layer**: 纯工具函数层
  - 零业务逻辑 (无 Toast、无错误处理、无数据转换)
  - 纯粹的"怎么做"(文件读写、命令执行、路径处理)
  - 可跨项目复用
- **System Layer**: 底层系统调用

---

## **2. 数据模型设计**

### **2.1 数据存储**

**存储位置**: `<workspaceRoot>/requirements.json`

**说明**:
- 数据文件存储在用户配置的 `workspaceRoot` 目录中
- 例如: `~/workspaces/requirements.json`
- 使用 Node.js `fs/promises` API 进行文件读写

### **2.2 核心数据结构**

```typescript
interface Requirement {
  id: string;                     // 需求id
  iteration: string;              // 迭代版本 (e.g., "24.10.1")
  name: string;                   // 需求名称
  deadline: number;               // 需求提测时间
  context: ContextInfo[]          // 上下文信息(e.g., PRD 文档,TRD 文档链接 等)
  worktrees?: WorktreeInfo[];     // 关联的 worktree 信息
}

interface ContextInfo {
  type: 'link' // 后续可能会扩展更多类型
  label: string
  content: string
}

interface WorktreeInfo {
  label: string                    // worktree label
  path: string;                   // worktree 绝对路径
  branch: string;                 // 分支名称
  repository: string;             // 所属仓库
}

interface RequirementsData {
  version: string;                // 数据格式版本
  requirements: Requirement[];
  lastSyncAt?: string;            // 最后同步时间
}
```

### **2.3 数据示例**

```json
{
  "version": "1.0",
  "requirements": [
    {
      "id": "req-123e4567-e89b",
      "iteration": "24.10.1",
      "name": "用户登录重构",
      "deadline": 1729872000000,
      "context": [
        {
          "type": "link",
          "label": "PRD",
          "content": "https://confluence.company.com/prd/123"
        },
        {
          "type": "link",
          "label": "TRD",
          "content": "https://confluence.company.com/trd/123"
        },
        {
          "type": "link",
          "label": "设计稿",
          "content": "https://figma.com/design/123"
        }
      ],
      "worktrees": [
        {
          "label": "主分支",
          "path": "/Users/dev/workspaces/user-login-refactor",
          "branch": "user-login-refactor",
          "repository": "user-center"
        }
      ]
    }
  ],
  "lastSyncAt": "2025-10-14T15:30:00Z"
}
```

---

## **3. 核心模块设计**

### **3.1 Hooks Layer (业务逻辑高内聚层)**

**设计理念**: Hooks 包含完整业务流程,从验证、执行到 Toast 提示、数据更新,所有逻辑高内聚在一起

---

#### **3.1.1 useRequirements.ts (需求数据管理)**

**职责**: 需求数据的完整生命周期管理

**核心 Hooks**:
- `useRequirements()`: 加载并缓存所有需求数据
- `useAddRequirement()`: 添加新需求 (包含数据处理 + 保存 + Toast)
- `useUpdateRequirement()`: 更新需求 (包含验证 + 保存 + Toast)
- `useDeleteRequirement()`: 删除需求 (包含确认 + 保存 + Toast)
- `useGroupedRequirements()`: 按迭代分组 (包含数据转换逻辑)
- `useAddWorktree()`: 添加 worktree 到需求
- `useRemoveWorktree()`: 从需求中移除 worktree

**实现示例**:
```typescript
import { useCachedPromise } from "@raycast/utils";
import { useCallback, useMemo } from "react";
import { showToast, Toast, getPreferenceValues } from "@raycast/api";
import * as fsUtils from "../utils/fs";
import * as pathUtils from "../utils/path";

/**
 * Hook: 加载需求数据 (带缓存)
 * 包含: 文件读取 + 错误处理
 */
export function useRequirements() {
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCachedPromise(
    async () => {
      const filePath = pathUtils.getDataFilePath(workspaceRoot);
      try {
        const data = await fsUtils.readJSON<RequirementsData>(filePath);
        return data.requirements;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return []; // 文件不存在,返回空数组
        }
        throw error;
      }
    },
    [],
    {
      keepPreviousData: true,
      initialData: [],
    }
  );
}

/**
 * Hook: 添加需求
 * 包含: 数据处理 + ID 生成 + 文件保存 + Toast + 缓存刷新
 */
export function useAddRequirement() {
  const { mutate } = useRequirements();
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(
    async (req: Omit<Requirement, "id" | "worktrees">) => {
      await showToast({ style: Toast.Style.Animated, title: "添加需求中..." });

      try {
        const filePath = pathUtils.getDataFilePath(workspaceRoot);

        // 1. 读取现有数据
        let requirements: Requirement[] = [];
        try {
          const data = await fsUtils.readJSON<RequirementsData>(filePath);
          requirements = data.requirements;
        } catch (error) {
          // 文件不存在,使用空数组
        }

        // 2. 创建新需求
        const newReq: Requirement = {
          ...req,
          id: crypto.randomUUID(),
          worktrees: [],
        };

        // 3. 添加并保存
        requirements.push(newReq);
        await fsUtils.writeJSON(filePath, {
          version: "1.0",
          requirements,
          lastSyncAt: new Date().toISOString(),
        });

        // 4. 刷新缓存
        await mutate();

        await showToast({ style: Toast.Style.Success, title: "需求添加成功" });
        return newReq;
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "添加失败",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [mutate, workspaceRoot]
  );
}

/**
 * Hook: 按迭代分组
 * 包含: 数据转换逻辑
 */
export function useGroupedRequirements() {
  const { data: requirements, isLoading } = useRequirements();

  const grouped = useMemo(() => {
    if (!requirements) return new Map();

    const map = new Map<string, Requirement[]>();
    requirements.forEach((req) => {
      if (!map.has(req.iteration)) {
        map.set(req.iteration, []);
      }
      map.get(req.iteration)!.push(req);
    });
    return map;
  }, [requirements]);

  return { data: grouped, isLoading };
}
```

**实现要点**:
- ✅ 高内聚: 所有需求数据相关的业务逻辑都在这里
- ✅ 包含 Toast: 用户操作反馈直接在 Hook 中处理
- ✅ 包含数据转换: 如按迭代分组逻辑
- ✅ 调用 Utils: 使用 `fsUtils.readJSON`/`writeJSON` 完成底层操作
- ✅ 自动缓存: `useCachedPromise` + `mutate()` 自动管理

---

#### **3.1.2 useGitOperations.ts (Git worktree 写操作)**

**职责**: Git worktree 创建/删除的完整业务流程

**核心 Hooks**:
- `useCreateWorktree()`: 创建 worktree (验证 → 执行 → Toast → 数据更新)
- `useRemoveWorktree()`: 删除 worktree (确认 → 执行 → Toast → 数据更新)

**实现示例**:
```typescript
import { useCallback } from "react";
import { showToast, Toast, confirmAlert } from "@raycast/api";
import * as execUtils from "../utils/exec";
import * as pathUtils from "../utils/path";
import { useAddWorktree, useRemoveWorktreeFromRequirement } from "./useRequirements";

interface CreateWorktreeParams {
  requirementId: string;
  repoPath: string;
  branch: string;
  label: string;
  repository: string;
}

/**
 * Hook: 创建 worktree
 * 包含: 验证 → Git 命令执行 → Toast → 数据更新 → 完整业务流程
 */
export function useCreateWorktree() {
  const addWorktree = useAddWorktree();
  const { workspaceRoot } = getPreferenceValues<Preferences>();

  return useCallback(
    async (params: CreateWorktreeParams) => {
      await showToast({ style: Toast.Style.Animated, title: "创建 worktree 中..." });

      try {
        // 1. 生成目标路径
        const targetPath = pathUtils.getWorktreePath(workspaceRoot, params.branch);

        // 2. 检查路径是否已存在
        // ... (省略路径检查逻辑)

        // 3. 执行 git worktree add (调用纯工具函数)
        await execUtils.execGit(
          ["worktree", "add", "-b", params.branch, targetPath],
          {
            cwd: params.repoPath,
            timeout: 30000,
          }
        );

        // 4. 更新需求数据
        await addWorktree(params.requirementId, {
          label: params.label,
          path: targetPath,
          branch: params.branch,
          repository: params.repository,
        });

        await showToast({
          style: Toast.Style.Success,
          title: "Worktree 创建成功",
          message: `分支: ${params.branch}`,
        });

        return targetPath;
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "创建失败",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [addWorktree, workspaceRoot]
  );
}

/**
 * Hook: 删除 worktree
 * 包含: 二次确认 → Git 命令执行 → Toast → 数据更新
 */
export function useRemoveWorktree() {
  const removeWorktree = useRemoveWorktreeFromRequirement();

  return useCallback(
    async (requirementId: string, worktreePath: string) => {
      // 1. 二次确认
      const confirmed = await confirmAlert({
        title: "删除 Worktree",
        message: `确定要删除 ${worktreePath} 吗?`,
        primaryAction: {
          title: "删除",
          style: confirmAlert.ActionStyle.Destructive,
        },
      });

      if (!confirmed) return;

      await showToast({ style: Toast.Style.Animated, title: "删除 worktree 中..." });

      try {
        // 2. 执行 git worktree remove
        await execUtils.execGit(["worktree", "remove", worktreePath], {
          timeout: 10000,
        });

        // 3. 更新需求数据
        await removeWorktree(requirementId, worktreePath);

        await showToast({ style: Toast.Style.Success, title: "Worktree 删除成功" });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "删除失败",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [removeWorktree]
  );
}
```

**实现要点**:
- ✅ 高内聚: 创建/删除 worktree 的所有业务逻辑都在这里
- ✅ 包含验证: 路径检查、二次确认等业务规则
- ✅ 包含 Toast: 所有用户反馈
- ✅ 包含数据更新: 调用 `useAddWorktree`/`useRemoveWorktree` 更新数据
- ✅ 调用 Utils: 使用 `execUtils.execGit` 执行底层命令

---

#### **3.1.3 useGitRepository.ts (Git 状态查询)**

**职责**: Git 仓库状态查询 + 输出解析

**核心 Hooks**:
- `useIsGitRepository(repoPath)`: 检查是否为 Git 仓库
- `useRepoRoot(startPath)`: 获取仓库根目录
- `useListWorktrees(repoPath)`: 列出所有 worktree (包含输出解析逻辑)
- `useBranchExists(repoPath, branchName)`: 检查分支是否存在

**实现示例**:
```typescript
import { useExec } from "@raycast/utils";

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
      const worktrees: Array<{ path: string; branch: string }> = [];
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
      return worktrees;
    },
  });
}
```

**实现要点**:
- ✅ 使用 `useExec`: 自动管理 loading/error 状态
- ✅ 包含解析逻辑: Git 输出解析逻辑在 `parseOutput` 中
- ✅ 只读操作: 不涉及 Toast (只有写操作需要用户反馈)

---

#### **3.1.4 useClaudeCode.ts (Claude Code 集成)**

**职责**: Claude Code CLI 调用 + 降级处理

**核心 Hook**:
- `useGenerateBranchName()`: 生成分支名 (包含降级处理 + Toast)

**实现示例**:
```typescript
import { useCallback } from "react";
import { showToast, Toast } from "@raycast/api";
import * as execUtils from "../utils/exec";

export function useGenerateBranchName() {
  return useCallback(async (requirementName: string) => {
    try {
      // 调用纯工具函数执行 Claude Code 命令
      const branchName = await execUtils.execClaude(
        `Generate a git-safe branch name in kebab-case from: ${requirementName}`,
        { timeout: 10000 }
      );
      return branchName.trim();
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
```

---

#### **3.1.5 useEditor.ts (编辑器操作)**

**职责**: 编辑器操作 + Toast 反馈

**核心 Hooks**:
- `useOpenInEditor()`: 打开编辑器 (包含执行 + Toast)
- `useShowInFinder()`: 在 Finder 中显示

**实现示例**:
```typescript
import { useCallback } from "react";
import { showToast, Toast } from "@raycast/api";
import * as execUtils from "../utils/exec";

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
```

---

### **3.2 Utils Layer (纯工具函数层)**

**设计理念**: 零业务逻辑,纯粹的"怎么做",可跨项目复用

---

#### **3.2.1 fs.ts (文件系统操作)**

**职责**: 纯文件读写操作,无业务逻辑

**核心函数**:
- `readJSON<T>(filePath)`: 读取 JSON 文件
- `writeJSON<T>(filePath, data)`: 写入 JSON 文件
- `ensureDir(dirPath)`: 确保目录存在

**实现示例**:
```typescript
import fs from "fs/promises";
import path from "path";

/**
 * 读取 JSON 文件
 * 纯函数: 不包含任何业务逻辑,不处理错误(由调用方处理)
 */
export async function readJSON<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * 写入 JSON 文件
 * 纯函数: 不包含 Toast,不处理错误
 */
export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
```

**实现要点**:
- ✅ 零业务逻辑: 不包含 Toast、错误处理、数据转换
- ✅ 纯函数: 输入 → 输出,无副作用(除了文件 I/O)
- ✅ 可复用: 可以在任何项目中使用

---

#### **3.2.2 exec.ts (命令执行封装)**

**职责**: 纯命令执行,无业务逻辑

**核心函数**:
- `execGit(args, options)`: 执行 git 命令
- `execClaude(prompt, options)`: 执行 Claude Code 命令
- `execOpen(path, options)`: 执行 open 命令

**实现示例**:
```typescript
import { promisify } from "util";
import { execFile } from "child_process";

const execFileAsync = promisify(execFile);

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
}

/**
 * 执行 git 命令
 * 纯函数: 不包含 Toast,不处理业务错误,直接抛出
 */
export async function execGit(args: string[], options?: ExecOptions): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: options?.cwd,
    timeout: options?.timeout || 30000,
  });
  return stdout;
}

/**
 * 执行 Claude Code 命令
 * 纯函数: 不包含降级逻辑,直接抛出错误
 */
export async function execClaude(prompt: string, options?: ExecOptions): Promise<string> {
  const { stdout } = await execFileAsync("claude", [prompt], {
    timeout: options?.timeout || 10000,
  });
  return stdout;
}

/**
 * 执行 open 命令
 * 纯函数: 不包含 Toast
 */
export async function execOpen(path: string, options?: ExecOptions): Promise<void> {
  await execFileAsync("open", [path], {
    timeout: options?.timeout || 5000,
  });
}
```

**实现要点**:
- ✅ 零业务逻辑: 不包含 Toast、降级处理、错误转换
- ✅ 纯函数: 执行命令,返回结果,错误直接抛出
- ✅ 可复用: 可以在任何需要执行这些命令的地方使用

---

#### **3.2.3 path.ts (路径处理)**

**职责**: 纯路径计算,无业务逻辑

**核心函数**:
- `getDataFilePath(workspaceRoot)`: 获取数据文件路径
- `getWorktreePath(workspaceRoot, branchName)`: 获取 worktree 路径
- `expandTilde(path)`: 展开 ~ 为用户主目录

**实现示例**:
```typescript
import path from "path";

/**
 * 展开 ~ 为用户主目录
 * 纯函数: 简单字符串处理
 */
export function expandTilde(filePath: string): string {
  if (filePath.startsWith("~/")) {
    return path.join(process.env.HOME || "", filePath.slice(2));
  }
  return filePath;
}

/**
 * 获取数据文件路径
 * 纯函数: 路径拼接,无业务逻辑
 */
export function getDataFilePath(workspaceRoot: string): string {
  const expandedRoot = expandTilde(workspaceRoot);
  return path.join(expandedRoot, "requirements.json");
}

/**
 * 获取 worktree 路径
 * 纯函数: 路径拼接
 */
export function getWorktreePath(workspaceRoot: string, branchName: string): string {
  const expandedRoot = expandTilde(workspaceRoot);
  return path.join(expandedRoot, branchName);
}
```

**实现要点**:
- ✅ 零业务逻辑: 纯粹的路径计算
- ✅ 纯函数: 输入路径 → 输出路径
- ✅ 可复用: 通用路径工具函数

---

### **3.3 组件中的使用模式**

**设计理念**: 在 Command 组件中直接使用 Hooks,不直接调用 Utils

**示例 - View Requirements 命令**:
```typescript
import { List } from "@raycast/api";
import { useGroupedRequirements } from "../hooks/useRequirements";

export default function ViewRequirements() {
  // 直接使用 Hook,业务逻辑已经高内聚
  const { data: groupedRequirements, isLoading } = useGroupedRequirements();

  return (
    <List isLoading={isLoading} searchBarPlaceholder="搜索需求或迭代...">
      {Array.from(groupedRequirements.entries()).map(([iteration, reqs]) => (
        <List.Section key={iteration} title={iteration}>
          {reqs.map((req) => (
            <RequirementListItem key={req.id} requirement={req} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
```

**示例 - 创建 Worktree Action**:
```typescript
import { Action } from "@raycast/api";
import { useCreateWorktree } from "../hooks/useGitOperations";
import { useGenerateBranchName } from "../hooks/useClaudeCode";
import { useOpenInEditor } from "../hooks/useEditor";

function CreateWorktreeAction({ requirement, repoPath }: Props) {
  // 组合多个 Hooks
  const createWorktree = useCreateWorktree();
  const generateBranchName = useGenerateBranchName();
  const openInEditor = useOpenInEditor();

  async function handleCreate() {
    // 1. 生成分支名 (包含降级处理)
    let branchName = await generateBranchName(requirement.name);
    if (!branchName) {
      branchName = await promptForBranchName(); // 手动输入
      if (!branchName) return;
    }

    // 2. 创建 worktree (包含所有业务逻辑)
    const worktreePath = await createWorktree({
      requirementId: requirement.id,
      repoPath,
      branch: branchName,
      label: "主分支",
      repository: "repo-name",
    });

    // 3. 打开编辑器 (包含 Toast)
    await openInEditor(worktreePath);
  }

  return <Action title="Create Worktree" onAction={handleCreate} />;
}
```

**优势**:
- ✅ 极简组件: 组件逻辑极其简洁,只负责组合 Hooks
- ✅ 零重复: 业务逻辑在 Hooks 中,不会在组件间重复
- ✅ 易测试: Hooks 可以独立测试,组件只测试组合逻辑
- ✅ 易维护: 修改业务逻辑只需改 Hooks,Utils 几乎不需要改动

---

## **4. Raycast 命令设计**

### **4.1 主命令: View Requirements**

**命令名**: `view-requirements`

**UI 组件**:
- `List`: 主列表组件,按迭代分组显示需求
- `List.Section`: 每个迭代一个 Section
- `List.Item`: 每个需求一个 Item

**ActionPanel 操作**:

**Worktree 管理 Section**:
- 创建 Worktree (`Cmd+N`) - 提示输入 label 和选择仓库
- 打开 Worktree (`Cmd+O`) - 根据 label 显示列表供选择
- 删除 Worktree (`Cmd+Shift+Delete`) - 根据 label 显示列表供选择

**上下文 Section** (动态生成):
- 根据 `context` 数组动态生成操作
- 每个 `ContextInfo` 生成一个 Action
- 使用 `label` 作为 Action 标题
- 根据 `type` 决定操作方式:
  - `type: 'link'`: 使用 `Action.OpenInBrowser` 打开 `content` URL

**管理 Section**:
- 编辑需求 (`Cmd+E`)
- 删除需求 (`Cmd+Shift+D`)

---

### **4.2 辅助命令: Add Requirement**

**命令名**: `add-requirement`

**Form 字段**:
- `iteration`: 迭代版本 (必填)
- `name`: 需求名称 (必填)
- `deadline`: 提测时间 (必填, Date Picker)
- `context`: 上下文信息 (可选, 多个)
  - 每个上下文项包含:
    - `label`: 标签 (如 "PRD", "TRD", "设计稿")
    - `content`: 内容 (如 URL)
    - `type`: 固定为 "link"

**提交操作**:
- 使用 `useAddRequirement()` Hook
- `deadline` 转换为 Unix 时间戳 (毫秒)
- 显示 Toast 提示
- 成功后返回主界面 (`popToRoot()`)

**示例**:
```typescript
import { Form, Action, ActionPanel, showToast, Toast, popToRoot } from "@raycast/api";
import { useAddRequirement } from "../hooks/useRequirements";

export default function AddRequirement() {
  const addRequirement = useAddRequirement();

  async function handleSubmit(values: FormValues) {
    await showToast({ style: Toast.Style.Animated, title: "添加需求中..." });

    try {
      await addRequirement({
        iteration: values.iteration,
        name: values.name,
        deadline: new Date(values.deadline).getTime(),
        context: values.context || [],
      });

      await showToast({ style: Toast.Style.Success, title: "需求添加成功" });
      await popToRoot();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "添加失败",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="添加需求" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="iteration" title="迭代" placeholder="24.10.1" />
      <Form.TextField id="name" title="需求名称" placeholder="用户登录重构" />
      <Form.DatePicker id="deadline" title="提测时间" />

      <Form.Separator />

      <Form.TextField id="contextLabel" title="文档标签" placeholder="PRD" />
      <Form.TextField id="contextContent" title="文档链接" placeholder="https://..." />
    </Form>
  );
}
```

---

## **5. 配置管理**

### **5.1 Extension Preferences**

```json
{
  "preferences": [
    {
      "name": "workspaceRoot",
      "type": "directory",
      "required": true,
      "title": "工作目录根路径",
      "description": "存储 worktrees 和 requirements.json 的统一目录",
      "default": "~/workspaces"
    }
  ]
}
```

**说明**:
- MVP 版本仅一个配置项
- 编辑器使用系统默认应用

---

## **6. 错误处理策略**

### **6.1 错误分类**

| 错误类型 | 处理策略 | 用户提示 |
|---------|---------|---------|
| Git 命令失败 | 捕获并显示详细错误 | Toast + 操作建议 |
| 分支已存在 | 提示用户修改或添加后缀 | Toast 提示分支名冲突 |
| Worktree 路径冲突 | 检测并提示用户 | 显示冲突路径,提供清理选项 |
| 仓库路径无效 | 提示用户选择正确路径 | 打开目录选择器 |
| 数据解析失败 | 降级到空数据 | Toast 警告 |
| Claude Code 不可用 | 降级到手动输入 | Toast 提示并打开输入框 |

### **6.2 关键错误处理点**

**创建 Worktree 流程**:
1. 提示用户输入 worktree label
2. 选择仓库路径 → 验证是否为 Git 仓库
3. 调用 Claude Code 生成分支名 → 如果失败,提示用户手动输入
4. 验证生成的分支名是否符合 Git 规范
5. 检查分支名唯一性 → 如果已存在,提示用户修改或添加后缀
6. 检查目标路径 → 如已存在,二次确认删除
7. 执行 git worktree add → 捕获错误并显示
8. 更新需求数据 → 将 `WorktreeInfo` 添加到 `worktrees` 数组
9. 成功提示 → 提供"打开"快捷操作

**打开/删除 Worktree 流程**:
1. 从需求的 `worktrees` 数组读取所有 worktree
2. 显示 worktree 列表,使用 `label` 作为显示名称
3. 用户选择目标 worktree
4. 执行对应操作（打开编辑器或删除）

---

## **7. 性能优化**

### **7.1 数据缓存**

使用 `@raycast/utils` 的 `useCachedPromise`:
- 自动缓存 requirements 数据
- `keepPreviousData: true` 保持上一次数据,避免闪烁
- `mutate()` 写操作后自动刷新缓存
- 减少文件读取频率

**示例**:
```typescript
export function useRequirements() {
  return useCachedPromise(requirementsUtils.loadRequirements, [], {
    keepPreviousData: true,
    initialData: [],
  });
}
```

### **7.2 异步操作优化**

- Git 命令设置超时（创建: 30秒,删除: 10秒）
- `useExec` 提供自动 loading 状态
- `useCachedPromise` 避免重复请求
- 大量数据时使用分页或虚拟滚动

---

## **8. 安全考虑**

### **8.1 输入验证**

- 迭代格式: 正则验证 `^\d{2}\.\d{2}\.\d+$`
- 需求名称长度: 2-100 字符
- deadline: 必须是有效的 Unix 时间戳（毫秒）
- context 数组: 每个 ContextInfo 需验证:
  - `type`: 当前仅支持 "link"
  - `label`: 非空字符串
  - `content`: 对于 type="link", 需验证 URL 格式
- worktree label: 非空字符串,建议限制在 50 字符以内
- 路径安全: 检查路径遍历攻击

### **8.2 命令执行安全**

- 所有外部命令使用 `execFile` (避免 shell injection)
- Git 命令参数严格控制
- 路径使用 `path.join` 和 `path.normalize`

---

## **9. MVP 范围确认**

### **✅ MVP 包含的功能**

1. 需求数据的 CRUD (JSON 存储)
2. 按迭代分组展示
3. 单仓库 worktree 创建/删除
4. 通过 Claude Code 生成语义化分支名
5. 在编辑器中打开 worktree
6. 动态上下文信息管理（文档链接等）
7. 基础错误处理

### **❌ MVP 不包含的功能**

1. Excel 文件导入
2. 多仓库批量操作
3. 实时数据同步
4. Git 状态可视化
5. 部署与发布自动化

---

## **10. 开发时间估算**

| 模块 | 工作量 | 备注 |
|-----|-------|------|
| Utils 工具函数 | 1 天 | requirements, git, claude, editor 工具函数 |
| React Hooks | 1 天 | useRequirements, useGitRepository, useClaudeCode |
| UI 组件 | 1 天 | List + Form + ActionPanel |
| 命令集成 | 1 天 | 主命令 + 辅助命令 + Action 组合 |
| 错误处理 | 0.5 天 | Toast + Alert |
| 测试 | 1 天 | 单元测试 + 集成测试 |
| 文档与优化 | 0.5 天 | README + 代码注释 |
| **总计** | **6 天** | Hook-First 架构,简化开发流程 |

---

## **11. 风险与缓解措施**

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| Claude Code 不可用 | 中 | 提供手动输入分支名作为降级方案 |
| Claude Code 生成结果不符合预期 | 低 | 验证生成结果,允许用户修改 |
| Git 命令失败 | 高 | 详细错误提示 + 操作指南 |
| 数据迁移问题 | 中 | 版本号管理 + 数据校验 |
| 性能问题 | 低 | 缓存 + 异步加载 |

---

## **12. 附录**

### **12.1 关键依赖**

```json
{
  "dependencies": {
    "@raycast/api": "^1.103.0",
    "@raycast/utils": "^1.17.0"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

### **12.2 相关文档**

- [Raycast Extensions API](https://developers.raycast.com/api-reference)
- [Git Worktree 文档](https://git-scm.com/docs/git-worktree)

---

**文档结束**
