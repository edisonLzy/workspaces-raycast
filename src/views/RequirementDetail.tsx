import React from "react";
import { Detail, ActionPanel, Action, Icon } from "@raycast/api";
import type { Requirement } from "../types";

/**
 * 需求详情界面
 * 展示需求的基本信息和元数据
 */
export function RequirementDetail({ requirement }: { requirement: Requirement }) {
  const worktreeCount = requirement.worktrees?.length || 0;
  const deadline = new Date(requirement.deadline);
  const deadlineStr = deadline.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 构建 Markdown 内容
  const markdown = `
# ${requirement.name}

## 需求描述
${requirement.iteration} 版本的需求

---

## 基本信息
- **迭代版本**: ${requirement.iteration}
- **截止时间**: ${deadlineStr}
- **工作区数量**: ${worktreeCount} 个

${
  requirement.context.length > 0
    ? `
## 上下文文档
${requirement.context.map((ctx, idx) => `${idx + 1}. [${ctx.label}](${ctx.content})`).join("\n")}
`
    : ""
}
  `.trim();

  return (
    <Detail
      navigationTitle={requirement.name}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="需求名称" text={requirement.name} />
          <Detail.Metadata.Separator />

          <Detail.Metadata.Label title="迭代版本" text={requirement.iteration} icon={Icon.Tag} />
          <Detail.Metadata.Label title="截止时间" text={deadlineStr} icon={Icon.Calendar} />
          <Detail.Metadata.Label
            title="工作区数量"
            text={`${worktreeCount} 个`}
            icon={Icon.CodeBlock}
          />

          {requirement.context.length > 0 && (
            <>
              <Detail.Metadata.Separator />
              <Detail.Metadata.Label
                title="上下文文档"
                text={`${requirement.context.length} 个文档`}
                icon={Icon.Document}
              />
            </>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {requirement.context.length > 0 && (
            <ActionPanel.Section title="上下文文档">
              {requirement.context.map((ctx, idx) => (
                <Action.OpenInBrowser
                  key={idx}
                  title={`打开 ${ctx.label}`}
                  url={ctx.content}
                  icon={Icon.Link}
                />
              ))}
            </ActionPanel.Section>
          )}
        </ActionPanel>
      }
    />
  );
}
