import { promisify } from 'util';
import { execFile, exec as execShell } from 'child_process';

const execFileAsync = promisify(execFile);
const execShellAsync = promisify(execShell);

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
  shell?: boolean; // 是否使用 shell 执行 (解决环境变量和 PATH 问题)
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
  // 如果需要 shell 环境 (例如 Node.js 脚本需要 PATH)
  if (options?.shell) {
    // 转义参数以防止注入攻击
    const escapedArgs = args.map((arg) => {
      // 使用单引号包裹并转义其中的单引号
      return `'${arg.replace(/'/g, '\'\\\'\'')}'`;
    });
    const fullCommand = [command, ...escapedArgs].join(' ');

    const { stdout } = await execShellAsync(fullCommand, {
      cwd: options.cwd,
      timeout: options.timeout || 30000,
      // 使用 login shell 以确保 PATH 正确
      shell: '/bin/zsh',
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:' + (process.env.PATH || ''),
      },
    });
    return stdout;
  }

  // 默认使用 execFile (更安全,无需转义)
  // 扩展 PATH 以确保能找到全局安装的命令
  const { stdout } = await execFileAsync(command, args, {
    cwd: options?.cwd,
    timeout: options?.timeout || 30000,
    env: {
      ...process.env,
      PATH: '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:' + (process.env.PATH || ''),
    },
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
