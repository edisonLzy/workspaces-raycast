# Workspaces Manager

高效管理开发需求和 Git worktrees 的 Raycast Extension。

## 功能特性

### MVP 版本功能

- **需求管理**
  - 创建、查看、删除需求
  - 按迭代版本分组展示
  - 支持设置需求截止时间
  - 支持添加上下文信息（PRD、TRD、设计稿等文档链接）

- **Worktree 管理**
  - 为需求创建独立的 Git worktree
  - 自动生成语义化分支名（集成 Claude Code）
  - 在编辑器中快速打开 worktree
  - 删除不再需要的 worktree

- **智能分支命名**
  - 集成 Claude Code 自动生成符合 Git 规范的分支名
  - 分支名验证（符合 Git 规范）
  - Claude Code 不可用时自动降级为简单的 kebab-case 转换

## 系统要求

- macOS 12.0+
- Node.js 22.0+
- Git 2.x+
- Claude Code CLI（可选，用于智能分支命名）

## 安装

### 开发模式

```bash
# 克隆项目
git clone <repository-url>
cd workspaces-raycast

# 安装依赖
npm install

# 开发模式运行
npm run dev
```

### 生产构建

```bash
npm run build
```

## 配置

首次使用时,需要在 Raycast 设置中配置工作目录根路径:

- **工作目录根路径** (`workspaceRoot`): 存储 worktrees 和 requirements.json 的统一目录
  - 默认值: `~/workspaces`
  - 示例: `/Users/yourname/workspaces`

## 使用指南

### 界面层级结构

```
需求列表 (View Requirements)
  └─> 需求详情/工作区列表 (Requirement Detail)
       ├─> 需求信息区域
       │    ├─ 迭代版本
       │    ├─ 截止时间
       │    └─ 上下文文档
       └─> 工作区列表
            └─> Worktree 操作
                 ├─ 在编辑器中打开
                 ├─ 在 Finder 中显示
                 ├─ 复制路径/分支名
                 ├─ 创建新 Worktree
                 └─ 删除 Worktree
```

### 1. 添加需求

使用 `Add Requirement` 命令:

1. 填写迭代版本（格式: YY.MM.N,如 24.10.1）
2. 填写需求名称（2-100 字符）
3. 选择提测时间
4. 可选：添加上下文信息（PRD、TRD、设计稿链接等）

### 2. 查看需求列表

使用 `View Requirements` 命令:

- 需求按迭代版本分组显示
- 显示截止时间和关联的 worktree 数量
- 支持搜索需求名称或迭代版本
- 按 `Enter` 进入需求详情

### 3. 查看需求详情

在需求列表中选择需求后按 `Enter`:

**需求信息区域**:
- 迭代版本、截止时间
- 上下文文档列表（可快速打开 PRD、TRD 等）

**工作区列表**:
- 展示该需求下的所有 worktree
- 显示 worktree 标签、分支名、仓库名
- 暂无工作区时提示按 `Cmd+N` 创建

### 4. 管理 Worktree

在需求详情的工作区列表中,每个 worktree 支持以下操作:

**快捷操作**:
- `Cmd+O`: 在编辑器中打开
- `Cmd+F`: 在 Finder 中显示
- `Cmd+C`: 复制工作区路径
- `Cmd+Shift+C`: 复制分支名
- `Cmd+N`: 创建新 Worktree
- `Cmd+Delete`: 删除此 Worktree

### 5. 创建 Worktree

在工作区列表中按 `Cmd+N`:

1. 显示当前需求信息
2. 输入 worktree 标签（如"主分支"、"前端开发"）
3. 选择 Git 仓库路径
4. 点击"生成分支名"自动生成,或手动输入分支名
5. 填写仓库名称
6. 确认创建

系统会:
- 自动创建 Git worktree
- 将 worktree 信息关联到需求
- 在编辑器中打开 worktree

### 6. 访问上下文信息

在需求详情的"上下文文档"项:
- 点击后在 Actions 中查看所有文档链接
- 直接打开浏览器访问 PRD、TRD、设计稿等

## 项目架构

采用 **Hook-First 高内聚架构**:

```
src/
├── utils/              # 纯工具函数层（零业务逻辑）
│   ├── fs.ts          # 文件系统操作
│   ├── exec.ts        # 命令执行封装
│   └── path.ts        # 路径处理工具
├── hooks/              # 业务逻辑高内聚层
│   ├── useRequirements.ts      # 需求数据管理
│   ├── useGitRepository.ts     # Git 状态查询
│   ├── useGitOperations.ts     # Git worktree 操作
│   ├── useClaudeCode.ts        # Claude Code 集成
│   └── useEditor.ts            # 编辑器操作
├── types.ts            # 数据类型定义
├── view-requirements.tsx       # 主命令
└── add-requirement.tsx         # 添加需求命令
```

### 设计原则

- **Utils Layer**: 纯粹的"怎么做",可跨项目复用
- **Hooks Layer**: 包含完整业务流程（验证 → 执行 → Toast → 数据更新）
- **Commands Layer**: 极简组件,只负责组合 Hooks

## 数据存储

数据存储在 `<workspaceRoot>/requirements.json`:

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

## 技术栈

- **Runtime**: Node.js 22+
- **Framework**: Raycast Extensions API v1.103+
- **Language**: TypeScript 5.x
- **React**: React 19
- **依赖**:
  - `@raycast/api`: ^1.103.0
  - `@raycast/utils`: ^1.17.0

## 开发脚本

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 自动修复
npm run fix-lint
```

## 相关文档

- [产品需求文档 (PRD)](./docs/prd-mvp.md)
- [技术设计文档 (TRD)](./docs/trd-mvp.md)

## License

MIT
