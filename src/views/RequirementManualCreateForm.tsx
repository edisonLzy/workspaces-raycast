import React, { useState } from 'react';
import {
  Form,
  ActionPanel,
  Action,
  useNavigation,
} from '@raycast/api';
import { useForm, FormValidation } from '@raycast/utils';
import dayjs from 'dayjs';
import { useCreateRequirement } from '../hooks/useCreateRequirement';
import type { ContextInfo } from '../types';

interface ManualRequirementFormValues {
  iteration: string;
  name: string;
  deadline: Date | null;
  isFinished: boolean;
}

interface ContextFormValues {
  contextLabel: string;
  contextUrl: string;
}

/**
 * 手动创建需求表单
 * 用于手动输入需求信息
 */
export function RequirementManualCreateForm() {
  const { pop } = useNavigation();
  const createRequirement = useCreateRequirement();
  const [contexts, setContexts] = useState<ContextInfo[]>([]);

  const { handleSubmit, itemProps } = useForm<ManualRequirementFormValues>({
    async onSubmit(values) {
      try {
        if (!values.deadline) {
          throw new Error('请选择截止日期');
        }

        await createRequirement({
          iteration: values.iteration,
          name: values.name,
          deadline: dayjs(values.deadline).format('YYYY-MM-DD'),
          isFinished: values.isFinished,
          context: contexts,
        });
        pop(); // 创建成功后返回上一页
      } catch (error) {
        // 错误已在 hook 中通过 Toast 显示
        console.error('创建需求失败:', error);
      }
    },
    validation: {
      iteration: FormValidation.Required,
      name: (value) => {
        if (!value || !value.trim()) {
          return '需求名称不能为空';
        }
        if (value.length < 2) {
          return '需求名称至少 2 个字符';
        }
        if (value.length > 100) {
          return '需求名称最多 100 个字符';
        }
      },
      deadline: FormValidation.Required,
    },
  });

  const contextForm = useForm<ContextFormValues>({
    onSubmit(values) {
      if (!values.contextLabel.trim() || !values.contextUrl.trim()) {
        return;
      }

      setContexts((prev) => [
        ...prev,
        {
          type: 'link',
          label: values.contextLabel,
          content: values.contextUrl,
        },
      ]);

      // 清空输入
      contextForm.reset({
        contextLabel: '',
        contextUrl: '',
      });
    },
    validation: {
      contextLabel: (value) => {
        if (value && value.trim() && !contextForm.values.contextUrl?.trim()) {
          return '请同时填写 URL';
        }
      },
      contextUrl: (value) => {
        if (value && value.trim()) {
          try {
            new URL(value);
          } catch {
            return '必须是有效的 URL';
          }
          if (!contextForm.values.contextLabel?.trim()) {
            return '请同时填写标签';
          }
        }
      },
    },
  });

  return (
    <Form
      navigationTitle="手动创建需求"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="创建需求" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="说明"
        text="手动输入需求信息创建新需求"
      />
      <Form.Separator />

      <Form.TextField
        title="迭代"
        placeholder="例如: 24.10.1"
        info="需求所属的迭代版本,格式: YY.MM.N"
        {...itemProps.iteration}
      />

      <Form.TextField
        title="需求名称"
        placeholder="例如: 用户登录功能优化"
        info="需求的名称描述 (2-100 个字符)"
        {...itemProps.name}
      />

      <Form.DatePicker
        title="截止日期"
        info="需求的提测或完成日期"
        {...itemProps.deadline}
      />

      <Form.Checkbox
        title="完成状态"
        label="已完成"
        info="标记需求是否已经完成"
        {...itemProps.isFinished}
      />

      <Form.Separator />

      <Form.Description
        title="上下文链接"
        text={`已添加 ${contexts.length} 个链接${contexts.length > 0 ? `: ${contexts.map((c) => c.label).join(', ')}` : ''}`}
      />

      <Form.TextField
        title="链接标签"
        placeholder="例如: PRD, 设计稿, TRD"
        info="描述这个链接的用途"
        {...contextForm.itemProps.contextLabel}
      />

      <Form.TextField
        title="链接 URL"
        placeholder="https://..."
        info="文档或资源的完整 URL"
        {...contextForm.itemProps.contextUrl}
      />

      <Form.Description text="" />

      {contexts.length > 0 && (
        <>
          <Form.Separator />
          {contexts.map((ctx, idx) => (
            <Form.Description
              key={idx}
              title={`${ctx.label}`}
              text={ctx.content}
            />
          ))}
        </>
      )}
    </Form>
  );
}
