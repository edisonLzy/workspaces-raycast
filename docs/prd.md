### **产品需求文档 (PRD): "DevFlow Assistant" for Raycast**

| **版本** | **日期** | **作者** | **状态** |
| :--- | :--- | :--- | :--- |
| 1.0 | 2025-10-14 | Gemini (PM) | 初稿 |
| 1.1 | 2025-10-14 | Gemini (PM) | 已修订 |

---

### **1. 背景与目标**

#### **1.1. 项目背景**
在快节奏的敏捷开发模式下，开发人员通常需要在单个迭代中处理多个需求。这些需求可能分布在不同的代码仓库中，甚至在同一仓库的不同分支上并行开发。当前工作流存在以下核心痛点：
*   **高昂的上下文切换成本**：在不同需求的Git分支、IDE窗口和相关文档之间频繁切换，导致精力分散和效率下降。
*   **分散的需求文档**：PRD、TRD、Keynote等关键文档散落在各处，查找费时，无法与开发任务直接关联。
*   **繁琐的部署与发布流程**：手动执行测试环境部署、创建Pull Request、填写Checklist等重复性操作，流程繁琐且容易出错。

#### **1.2. 产品目标**
我们计划开发一款名为 **"DevFlow Assistant"** 的Raycast插件，旨在解决上述痛点。该插件将作为一个集中的工作流引擎，通过统一的界面和自动化能力，帮助开发人员简化从需求理解到代码发布的整个生命周期，核心目标是：
*   **降低认知负荷**：将需求、代码、文档和流程操作聚合，减少不必要的上下文切换。
*   **提升开发效率**：通过一键式操作和自动化脚本，简化重复性任务。
*   **确保流程规范**：将部署、发布等关键节点流程化、自动化，减少人为失误。

### **2. 用户画像**

*   **角色**：软件工程师 (Web开发者)
*   **场景**：在迭代周期内，需要同时开发和跟进1个或多个功能需求。
*   **痛点**：
    *   "我需要同时开发3个需求，它们在2个不同的代码库里，我得频繁切换分支，有时甚至搞混了。"
    *   "每次开始一个新任务，我都要去翻Confluence找PRD，去FigJam找设计稿，太麻烦了。"
    *   "部署到测试环境的脚本每次都要手动跑，提PR时还要一个个复制Checklist，这些重复工作很枯燥。"

### **3. MVP 功能需求 (Functional Requirements)**

#### **FR1: 迭代与需求加载**
*   **描述**: 插件需要能从指定的数据源加载当前和未来的迭代信息及相关需求列表。
*   **数据源**: MVP阶段，数据源为一个本地的 **Excel (.xlsx) 文件**。
*   **实现建议**:
    *   在插件的设置中，允许用户配置此Excel文件的绝对路径。
    *   插件通过内置的解析脚本（推荐使用Node.js的库在Raycast插件内部完成，比AI解析更稳定可靠）读取文件内容。
    *   **Excel文件格式约定 (建议)**:
        | Iteration | Requirement Name | Repository | PRD Link | TRD Link | Keynote Link | ... (可扩展) |
        | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
        | 24.10.1 | 用户登录重构 | user-center | http://... | http://... | http://... | |
        | 24.10.1 | 首页UI优化 | main-app | http://... | http://... | http://... | |
        | 24.10.2 | 支付功能 | payment-gateway | http://... | http://... | http://... | |

#### **FR2: 主界面 - 需求列表**
*   **描述**: 在Raycast中启动插件后，展示一个清晰、可交互的需求列表。
*   **UI设计**:
    *   使用Raycast的 `List` 组件。
    *   列表项按 **`Iteration` (迭代)** 进行分组。
    *   每个列表项代表一个 **`Requirement` (需求)**。
    *   每个需求项应显示 **`Requirement Name`**，并可选择性地在副标题或Accessory中显示 **`Repository`** 信息。
    *   列表支持搜索功能，可按需求名称、迭代名称等关键词快速过滤。

#### **FR3: 核心操作 - 工作区管理 (Workspace Management)**
*   **描述**: 针对每个需求，提供基于 `git worktree` 的工作区管理能力，实现代码环境的隔离。该流程现在支持为单个需求关联的多个仓库进行操作，并利用AI CLI工具生成标准化的命名。
*   **操作项 (在每个需求项的Action Panel中)**:
    *   **`创建工作区 (Create Workspace)`**:
        1.  **选择仓库**:
            *   触发操作后，弹出一个列表，显示所有在插件中配置的代码仓库。
            *   用户可以通过多选（如按 `Cmd` + `Enter`）来选择一个或多个需要创建worktree的仓库。
        2.  **智能命名**:
            *   对于用户选择的每一个仓库，插件将自动执行以下操作：
            *   获取当前需求的 **`Requirement Name`** (例如: "用户登录重构")。
            *   通过执行Shell命令，调用AI CLI工具 (如 `gemini-cli` 或 `claude-code`) 来生成一个符合Git分支规范的、语义化的名称。
            *   **示例命令**: `gemini "Generate a git-branch-safe name in kebab-case from the requirement: '用户登录重构'"`
            *   **预期输出**: `user-login-refactor`
        3.  **创建Worktree**:
            *   使用上一步生成的名称作为分支名和目录名。
            *   在对应的仓库路径下执行 `git worktree add ../workspaces-raycast-data/<generated-name> <generated-name>`。
            *   路径中的 `workspaces-raycast-data` 是用户在设置中配置的统一工作目录。
        4.  **错误处理**: 如果AI CLI命令执行失败或未安装，应提示用户“无法自动生成名称，请手动输入”，并提供一个输入框。如果 `git worktree` 命令失败（如分支已存在），也需给出明确提示。
    *   **`打开工作区 (Open Workspace)`**: 在用户偏好的IDE（如VS Code）中打开对应worktree的目录。执行 `code <path-to-worktree>`。
    *   **`删除工作区 (Delete Workspace)`**: 执行 `git worktree remove <path-to-worktree>`。**必须**有二次确认弹窗，防止误删。

#### **FR4: 核心操作 - 上下文信息查阅 (Context Access)**
*   **描述**: 快速访问与需求相关的各类文档。
*   **操作项 (在每个需求项的Action Panel中)**:
    *   **`查看PRD (View PRD)`**: 在默认浏览器中打开Excel中配置的 `PRD Link`。
    *   **`查看TRD (View TRD)`**: 在默认浏览器中打开 `TRD Link`。
    *   **`查看Keynote (View Keynote)`**: 在默认浏览器中打开 `Keynote Link`。
    *   **可扩展性**: 插件应能动态根据Excel中的列名生成这些 "查看" 操作，如果新增了 "Design Link" 列，则自动出现 "查看设计稿" 的选项。

### **4. 非功能性需求 (Non-Functional Requirements)**

*   **NFR1: 配置化**:
    *   必须提供一个设置界面或配置文件，允许用户定义：
        *   工作目录的根路径 (例如: `~/workspaces-raycast-data`)。
        *   代码仓库的本地路径映射 (例如: `{"user-center": "/Users/user/dev/user-center", "main-app": "/Users/user/dev/main-app"}` )。
        *   Excel数据源的路径。
        *   默认IDE (例如: `code`, `webstorm`)。
        *   AI CLI命令模板 (高级功能，可选，允许用户自定义调用AI的命令)。
*   **NFR2: 性能**:
    *   插件启动和列表加载速度应在1秒以内。
    *   文件解析不应阻塞UI线程。
*   **NFR3: 错误处理**:
    *   当Git命令执行失败（如worktree已存在）、脚本执行出错、文件找不到时，必须向用户提供清晰、可操作的错误提示（使用Raycast的Toast组件）。
*   **NFR4: 平台兼容性**:
    *   主要面向macOS（因为Raycast），Shell脚本应考虑通用性（如Bash/Zsh）。

### **5. MVP范围之外 (Out of Scope)**

*   **AI解析Excel内容**: MVP阶段不采用AI进行结构化数据解析，以保证稳定性和可预测性。
*   **与Git平台API的深度集成**: 如直接通过GitHub/GitLab API创建PR、获取状态等。MVP阶段通过执行本地脚本和git命令完成。
*   **实时数据同步**: 插件不会自动监听Excel文件或Git状态的变化，需要用户手动刷新（或重新执行命令）来加载最新信息。
*   **复杂的可视化配置界面**: MVP阶段的配置可通过Raycast自带的表单或一个JSON文件完成。
*   **自动化部署与发布流程 (新增)**: 包括 "一键部署到测试" 和 "准备上线" 等功能，将推迟到未来的版本中实现。
