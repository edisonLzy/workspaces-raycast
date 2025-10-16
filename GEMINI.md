# GEMINI.md

## Project Overview

This project is a Raycast Extension called "Workspaces Manager". It is designed to help developers efficiently manage their development requirements and Git worktrees. The extension is built with Node.js, TypeScript, and React, and it uses the Raycast API.

The core functionality of the extension includes:

*   **Requirement Management:** Creating, viewing, and deleting development requirements. Requirements are grouped by iteration and can have deadlines and associated context links (e.g., PRD, TRD, design documents).
*   **Worktree Management:** Creating and managing Git worktrees for each requirement. This allows developers to have separate, isolated environments for each task.


The project follows a "Hook-First" architecture, which promotes a clean separation of concerns. The business logic is encapsulated in React hooks, the UI is built with React components, and utility functions are kept separate.

Data is stored in a JSON file named `requirements.json` in the user's configured workspace root directory.

## Building and Running

### Prerequisites

*   Node.js >= 22.0.0
*   pnpm
*   Git

### Development

To run the extension in development mode, follow these steps:

1.  Install dependencies:
    ```bash
    pnpm install
    ```
2.  Start the development server:
    ```bash
    pnpm dev
    ```

### Production

To build the extension for production, run the following command:

```bash
pnpm build
```

### Testing

There are no explicit test commands defined in `package.json`. However, the project uses ESLint for code quality. To run the linter, use:

```bash
pnpm lint
```

To automatically fix linting errors, use:

```bash
pnpm fix-lint
```

## Development Conventions

*   **Package Manager:** The project uses `pnpm` for dependency management.
*   **Language:** TypeScript
*   **UI Framework:** React
*   **Code Style:** The project uses ESLint to enforce a consistent code style.
*   **Architecture:** The project follows a "Hook-First" architecture, with a clear separation of concerns between UI components (`views`), business logic (`hooks`), and utility functions (`utils`).
*   **Commit Messages:** The project uses `commitlint` with the `@commitlint/config-conventional` configuration to enforce a consistent commit message format.
*   **Data Storage:** Application data is stored in a `requirements.json` file in the user's workspace root directory.
