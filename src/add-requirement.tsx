import React, { useState } from "react";
import { Form, ActionPanel, Action, showToast, Toast, popToRoot } from "@raycast/api";
import { useAddRequirement } from "./hooks/useRequirements";
import type { ContextInfo } from "./types";

interface FormValues {
  iteration: string;
  name: string;
  deadline: Date;
  contexts: string; // JSON string of ContextInfo[]
}

export default function AddRequirement() {
  const addRequirement = useAddRequirement();

  const [iteration, setIteration] = useState("");
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [contextItems, setContextItems] = useState<ContextInfo[]>([]);
  const [contextLabel, setContextLabel] = useState("");
  const [contextContent, setContextContent] = useState("");

  function handleAddContext() {
    if (!contextLabel || !contextContent) {
      showToast({
        style: Toast.Style.Failure,
        title: "请填写完整的上下文信息",
      });
      return;
    }

    setContextItems([
      ...contextItems,
      {
        type: "link",
        label: contextLabel,
        content: contextContent,
      },
    ]);

    // 清空输入
    setContextLabel("");
    setContextContent("");

    showToast({
      style: Toast.Style.Success,
      title: "上下文已添加",
    });
  }

  function handleRemoveContext(index: number) {
    setContextItems(contextItems.filter((_, idx) => idx !== index));
    showToast({
      style: Toast.Style.Success,
      title: "上下文已移除",
    });
  }

  async function handleSubmit() {
    // 验证必填字段
    if (!iteration || !name || !deadline) {
      await showToast({
        style: Toast.Style.Failure,
        title: "请填写所有必填字段",
      });
      return;
    }

    // 验证迭代格式
    const iterationRegex = /^\d{2}\.\d{2}\.\d+$/;
    if (!iterationRegex.test(iteration)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "迭代格式错误",
        message: "格式应为: YY.MM.N (如 24.10.1)",
      });
      return;
    }

    // 验证需求名称长度
    if (name.length < 2 || name.length > 100) {
      await showToast({
        style: Toast.Style.Failure,
        title: "需求名称长度应在 2-100 字符之间",
      });
      return;
    }

    try {
      await addRequirement({
        iteration,
        name,
        deadline: deadline.getTime(),
        context: contextItems,
      });

      await popToRoot();
    } catch (error) {
      // 错误已在 Hook 中处理
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="添加需求" onSubmit={handleSubmit} />
          <Action title="添加上下文" icon="+" onAction={handleAddContext} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="iteration"
        title="迭代版本"
        placeholder="24.10.1"
        value={iteration}
        onChange={setIteration}
        info="格式: YY.MM.N"
      />
      <Form.TextField
        id="name"
        title="需求名称"
        placeholder="用户登录重构"
        value={name}
        onChange={setName}
        info="2-100 字符"
      />
      <Form.DatePicker
        id="deadline"
        title="提测时间"
        value={deadline}
        onChange={setDeadline}
        type={Form.DatePicker.Type.Date}
      />

      <Form.Separator />

      <Form.Description
        title="上下文信息"
        text={`已添加 ${contextItems.length} 个上下文项`}
      />

      {contextItems.length > 0 && (
        <Form.Description
          text={contextItems.map((ctx, idx) => `${idx + 1}. ${ctx.label}: ${ctx.content}`).join("\n")}
        />
      )}

      <Form.TextField
        id="contextLabel"
        title="上下文标签"
        placeholder="PRD / TRD / 设计稿"
        value={contextLabel}
        onChange={setContextLabel}
      />
      <Form.TextField
        id="contextContent"
        title="上下文链接"
        placeholder="https://..."
        value={contextContent}
        onChange={setContextContent}
      />

      {contextItems.length > 0 && (
        <Form.Dropdown id="removeContext" title="移除上下文" onChange={(value) => handleRemoveContext(Number(value))}>
          {contextItems.map((ctx, idx) => (
            <Form.Dropdown.Item key={idx} value={String(idx)} title={`${ctx.label}: ${ctx.content}`} />
          ))}
        </Form.Dropdown>
      )}
    </Form>
  );
}
