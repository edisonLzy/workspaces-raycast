import React, { useState } from 'react';
import {
  Form,
  ActionPanel,
  Action,
  Detail,
  showToast,
  Toast,
} from '@raycast/api';
import { useForm } from '@raycast/utils';
import { z } from 'zod';
import { useClaudeCode } from './hooks/useClaudeCode';

interface TestFormValues {
  prompt: string;
}

/**
 * Claude Code 测试页面
 * 用于测试 useClaudeCode hook 的功能
 */
export default function TestClaudeCode() {
  const { query } = useClaudeCode();
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps } = useForm<TestFormValues>({
    async onSubmit(values) {
      setIsLoading(true);
      setResult('正在调用 Claude Code...');

      try {
        await showToast({
          style: Toast.Style.Animated,
          title: '正在查询...',
          message: '使用 Claude Code 处理请求',
        });

        // 使用简单的字符串 schema 进行测试
        const response = await query(
          values.prompt,
          z.string(),
        );

        setResult(`### 查询成功!\n\n**Prompt:**\n${values.prompt}\n\n**Claude 响应:**\n\`\`\`\n${response}\n\`\`\``);

        await showToast({
          style: Toast.Style.Success,
          title: '查询成功',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setResult(`### ❌ 查询失败\n\n**错误信息:**\n\`\`\`\n${errorMessage}\n\`\`\`\n\n**可能的原因:**\n- Claude CLI 未安装或路径配置错误\n- 网络连接问题\n- 超时(10秒限制)\n\n**解决方法:**\n1. 在 Raycast 设置中配置正确的 Claude CLI 路径\n2. 运行 \`which claude\` 或 \`type claude\` 查找 CLI 路径\n3. 确保 Claude Code 已正确安装`);

        await showToast({
          style: Toast.Style.Failure,
          title: '查询失败',
          message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    validation: {
      prompt: (value) => {
        if (!value || !value.trim()) {
          return '请输入测试 prompt';
        }
      },
    },
  });

  if (result) {
    return (
      <Detail
        markdown={result}
        isLoading={isLoading}
        actions={
          <ActionPanel>
            <Action
              title="再次测试"
              onAction={() => setResult('')}
              shortcut={{ modifiers: ['cmd'], key: 'n' }}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <Form
      navigationTitle="测试 Claude Code"
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="发送查询"
            onSubmit={handleSubmit}
            shortcut={{ modifiers: ['cmd'], key: 'enter' }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="说明"
        text="此页面用于测试 Claude Code CLI 集成是否正常工作。输入任意 prompt 并提交,查看 Claude 的响应。"
      />
      <Form.Separator />

      <Form.TextArea
        title="测试 Prompt"
        placeholder="例如: 请用一句话介绍你自己"
        info="输入任意问题或指令来测试 Claude Code 是否正常工作"
        {...itemProps.prompt}
      />

      <Form.Description
        title="提示"
        text="如果查询失败,请在 Raycast 设置中配置 Claude CLI 的完整路径。可以运行 'which claude' 查找路径。"
      />
    </Form>
  );
}
