import { inspect } from 'util';
import React from 'react';
import {
  Form,
  ActionPanel,
  Action,
  useNavigation,
} from '@raycast/api';
import { useForm } from '@raycast/utils';
import { useSyncRequirements } from '../hooks/useSyncRequirements';

interface RequirementsCreateFormValues {
  scheduleDocPath: string[];
  prompt: string;
}

/**
 * 需求同步表单
 * 用于从排期文档同步需求到 requirements.json
 */
export function RequirementsCreateForm() {
  const { pop } = useNavigation();
  const syncRequirements = useSyncRequirements();

  const { handleSubmit, itemProps } = useForm<RequirementsCreateFormValues>({
    async onSubmit(values) {
      try {
        await syncRequirements({
          scheduleDocPath: values.scheduleDocPath[0],
          prompt: values.prompt,
        });
        pop(); // 同步成功后返回上一页
      } catch (error) {
        // 错误已在 hook 中通过 Toast 显示
        console.error('同步需求失败:', inspect(error, {
          depth: null, // 显示所有嵌套层级
          colors: false, // Raycast 日志不支持颜色
          showHidden: false, // 不显示隐藏属性
        }));
      }
    },
    validation: {
      scheduleDocPath: (value) => {
        if (!Array.isArray(value)) {
          return '请选择排期文档';
        }
        const v = value[0];
        if (!v.endsWith('.xlsx')) {
          return '请选择 Excel 文件 (.xlsx 格式)';
        }
      },
      prompt: (value) => {
        if (!value || !value.trim()) {
          return '请输入自定义prompt';
        }
      },
    },
  });

  return (
    <Form
      navigationTitle="同步排期文档"
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="开始同步"
            onSubmit={handleSubmit}
            shortcut={{ modifiers: ['cmd'], key: 'enter' }}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="说明"
        text="从 Excel 排期文档中同步需求,使用 Claude Code 进行智能筛选和解析"
      />
      <Form.Separator />

      <Form.FilePicker
        title="排期文档"
        allowMultipleSelection={false}
        canChooseDirectories={false}
        canChooseFiles={true}
        info="选择要同步的 Excel 排期文档 (.xlsx 格式)"
        {...itemProps.scheduleDocPath}
      />

      <Form.TextArea
        title="筛选条件"
        placeholder="例如: 只获取 24.10.1 迭代的前端相关需求"
        info="描述你想要筛选的需求条件,Claude Code 会根据此条件智能解析排期文档"
        {...itemProps.prompt}
      />

      <Form.Description
        title="数据处理方式"
        text="追加模式: 新需求将追加到现有数据,已存在的需求(相同迭代+名称)将被跳过"
      />
    </Form>
  );
}
