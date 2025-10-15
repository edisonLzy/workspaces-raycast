import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
}

/**
 * 执行 git 命令
 * 纯函数: 不包含 Toast,不处理业务错误,直接抛出
 */
export async function execGit(
  args: string[],
  options?: ExecOptions,
): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd: options?.cwd,
    timeout: options?.timeout || 30000,
  });
  return stdout;
}

/**
 * 执行 Claude Code 命令
 * 纯函数: 不包含降级逻辑,直接抛出错误
 */
export async function execClaude(
  prompt: string,
  options?: ExecOptions,
): Promise<string> {
  const { stdout } = await execFileAsync('claude', [prompt], {
    timeout: options?.timeout || 10000,
  });
  return stdout;
}

/**
 * 执行 open 命令
 * 纯函数: 不包含 Toast
 */
export async function execOpen(
  path: string,
  options?: ExecOptions,
): Promise<void> {
  await execFileAsync('open', [path], {
    timeout: options?.timeout || 5000,
  });
}
