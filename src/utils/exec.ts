import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
}

/**
 * 执行任意命令
 * 纯函数: 不包含 Toast,不处理业务错误,直接抛出
 */
export async function exec(
  command: string,
  args: string[],
  options?: ExecOptions,
): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: options?.timeout || 30000,
  });
  return stdout;
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
