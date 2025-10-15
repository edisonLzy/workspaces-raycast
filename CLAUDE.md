# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Workspaces Manager** is a Raycast Extension for managing development requirements and Git worktrees. It enables developers to organize requirements by iteration, create isolated worktrees for each task, and quickly access related documentation (PRD, TRD, design files).

## Essential Commands

### Development
```bash
pnpm dev              # Start Raycast development mode (hot reload)
pnpm build            # Build extension for production
```

### Code Quality
```bash
pnpm lint             # Run ESLint on all files
pnpm fix-lint         # Auto-fix ESLint violations
```

**Important**: This project uses **pnpm** as the package manager. Never use npm or yarn.

### Git Workflow
- Pre-commit hooks automatically run `lint-staged` (ESLint on staged files)
- Commit messages must follow Conventional Commits format (enforced by commitlint)
- Example: `feat: add worktree deletion`, `fix: branch name validation`, `chore: update dependencies`

## Architecture: Hook-First High Cohesion

The codebase follows a strict three-layer architecture where business logic is concentrated in React hooks, not scattered across components or utilities.

### Layer 1: Utils (`src/utils/`)
**Pure, zero-business-logic utilities** - reusable across any project:
- `fs.ts` - File system operations (read/write JSON with atomic writes)
- `exec.ts` - Command execution wrappers (execGit, execClaude with timeout support)
- `path.ts` - Path manipulation utilities

### Layer 2: Hooks (`src/hooks/`)
**Business logic concentration point** - each hook is a complete, self-contained workflow:

- `useRequirements.ts` - Requirement data management
  - CRUD operations for requirements (create, read, update, delete)
  - Grouped data views (requirements grouped by iteration)
  - Automatic data persistence to `requirements.json`

- `useGitRepository.ts` - Git repository queries
  - Check if directory is a Git repo
  - Get repo root path
  - List all worktrees with parsing
  - Branch name validation (Git naming rules)
  - Branch existence checks

- `useGitOperations.ts` - Git worktree lifecycle
  - Create worktree (with branch validation, conflict detection)
  - Remove worktree (with confirmation prompts)
  - Automatic requirement data updates
  - Toast notifications for success/failure

- `useClaudeCode.ts` - AI-powered branch naming
  - Integration with Claude Code CLI
  - Automatic fallback to kebab-case conversion if CLI unavailable
  - Timeout handling (10s max)

- `useEditor.ts` - Editor integration
  - Open directory in VS Code
  - Show in Finder
  - Configurable editor command

**Hook Design Pattern**: Each hook contains the complete workflow:
1. Input validation
2. Business logic execution
3. Error handling with user-friendly Toast messages
4. Data state updates
5. Side effects (file writes, external commands)

### Layer 3: Components (`src/requirements.tsx`, `src/views/`)
**Minimal presentation layer** - components only compose hooks and render UI:
- `requirements.tsx` - Main command entry point
- `views/RequirementsView.tsx` - List all requirements grouped by iteration
- `views/RequirementDetail.tsx` - Display requirement details and worktrees
- `views/WorktreesView.tsx` - (Currently empty, reserved for future)

**Component Responsibility**: Only handle:
- UI layout and Raycast API components
- Hook composition
- User interaction (form inputs, action triggers)
- Navigation between views

## Data Storage

All data is stored in `<workspaceRoot>/requirements.json`:

```typescript
{
  "version": "1.0",
  "requirements": [
    {
      "id": "req-uuid",
      "iteration": "24.10.1",        // Format: YY.MM.N
      "name": "Feature name",
      "deadline": 1729872000000,     // Unix timestamp (ms)
      "context": [                   // Documentation links
        {
          "type": "link",
          "label": "PRD",
          "content": "https://..."
        }
      ],
      "worktrees": [
        {
          "label": "主分支",           // User-friendly label
          "path": "/abs/path/to/worktree",
          "branch": "feature-branch",
          "repository": "repo-name"
        }
      ]
    }
  ],
  "lastSyncAt": "2025-10-14T15:30:00Z"
}
```

**Critical**: The `workspaceRoot` preference is set by users in Raycast settings and is required for the extension to function.

## Key Technical Constraints

### Git Worktree Integration
- Worktrees are created using `git worktree add <path> <branch>`
- Branch names must follow Git naming rules (validated in `useValidateBranchName`):
  - No leading `-`
  - No `..`
  - No spaces
  - No special characters: `~ ^ : ? * [ ] \`
- Before creating a worktree, check if branch already exists
- Worktree paths are stored as absolute paths

### Claude Code CLI Integration
- Used for intelligent branch name generation from requirement names
- Example: "用户登录重构" → "user-login-refactor"
- Timeout: 10 seconds
- Automatic fallback to simple kebab-case if Claude Code is unavailable
- Error handling must not block the user workflow

### ESLint Configuration
- ESLint 9.x with flat config format (`eslint.config.mjs`)
- TypeScript ESLint with recommended rules
- Stylistic plugin for formatting (single quotes, semicolons, 2-space indent)
- Import ordering: builtin → external → internal → parent → sibling → index → type
- Unused imports are automatically removed

## Raycast Extension Specifics

### Extension Structure
- Single command: `view-requirements` (renamed from `requirements.tsx`)
- Extension settings: `workspaceRoot` (directory preference)
- All commands must be registered in `package.json`

### Raycast API Patterns
- Use `useExec` from `@raycast/utils` for async command execution with loading states
- Use `showToast` for user feedback (success/error messages)
- Use `confirmAlert` before destructive operations (delete requirement/worktree)
- Navigation: `Action.Push` for drill-down views, `useNavigation().pop()` to go back

### Form Validation
- Iteration format: `YY.MM.N` (e.g., "24.10.1")
- Requirement name: 2-100 characters
- Branch names: validated against Git naming rules
- All validations should show clear error messages via Toast or Alert

## Common Workflows

### Adding New Hook
1. Create hook file in `src/hooks/`
2. Include complete workflow: validation → execution → error handling → data updates
3. Return both data and loading/error states
4. Use `useCallback` for functions to prevent unnecessary re-renders
5. Add Toast notifications for user feedback

### Modifying Data Schema
1. Update TypeScript interfaces in `src/types.ts`
2. Update data migration logic in `useRequirements.ts` if breaking changes
3. Consider backward compatibility with existing `requirements.json` files

### Adding New Component/View
1. Create in `src/views/` directory
2. Keep components minimal - delegate logic to hooks
3. Follow existing patterns for ActionPanel organization
4. Use consistent keyboard shortcuts across views

## Testing Considerations

When making changes:
- Test with and without Claude Code CLI available
- Test with empty `requirements.json` (first run scenario)
- Test with invalid Git repositories
- Test branch name edge cases (special characters, existing branches)
- Verify Toast messages are clear and actionable
- Test keyboard shortcuts don't conflict with Raycast defaults
