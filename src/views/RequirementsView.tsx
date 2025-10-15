import React from 'react';
import {
  List,
  ActionPanel,
  Action,
  Icon,
  confirmAlert,
  Alert,
} from '@raycast/api';
import {
  useGroupedRequirements,
  useDeleteRequirement,
} from '../hooks/useRequirements';
import { RequirementDetail } from './RequirementDetail';
import { WorktreesView } from './WorktreesView';
import type { Requirement } from '../types';

/**
 * 需求列表界面
 * 展示所有需求,按迭代分组
 */
export function RequirementsView() {
  const { data: groupedRequirements, isLoading } = useGroupedRequirements();
  const deleteRequirement = useDeleteRequirement();

  return (
    <List isLoading={isLoading} searchBarPlaceholder="搜索需求或迭代...">
      {Array.from(groupedRequirements.entries()).map(
        ([iteration, requirements]) => (
          <List.Section key={iteration} title={`迭代 ${iteration}`}>
            {requirements.map((req: Requirement) => {
              const worktreeCount = req.worktrees?.length || 0;
              const deadline = new Date(req.deadline);
              const deadlineStr = deadline.toLocaleDateString('zh-CN');

              const accessories: List.Item.Accessory[] = [
                { text: `${worktreeCount} worktree(s)`, icon: Icon.CodeBlock },
                { text: `截止: ${deadlineStr}`, icon: Icon.Calendar },
              ];

              return (
                <List.Item
                  key={req.id}
                  title={req.name}
                  subtitle={req.iteration}
                  accessories={accessories}
                  actions={
                    <ActionPanel>
                      <ActionPanel.Section title="工作区">
                        <Action.Push
                          title="查看工作区"
                          icon={Icon.CodeBlock}
                          target={<WorktreesView requirement={req} />}
                        />
                      </ActionPanel.Section>

                      <ActionPanel.Section title="需求详情">
                        <Action.Push
                          title="查看需求详情"
                          icon={Icon.AppWindow}
                          target={<RequirementDetail requirement={req} />}
                        />
                      </ActionPanel.Section>

                      {req.context.length > 0 && (
                        <ActionPanel.Section title="上下文">
                          {req.context.map((ctx, idx) => (
                            <Action.OpenInBrowser
                              key={idx}
                              title={`打开 ${ctx.label}`}
                              url={ctx.content}
                              icon={Icon.Link}
                            />
                          ))}
                        </ActionPanel.Section>
                      )}

                      <ActionPanel.Section title="管理">
                        <Action
                          title="删除需求"
                          icon={Icon.Trash}
                          style={Action.Style.Destructive}
                          shortcut={{ modifiers: ['cmd', 'shift'], key: 'd' }}
                          onAction={async () => {
                            const confirmed = await confirmAlert({
                              title: '删除需求',
                              message: `确定要删除需求 "${req.name}" 吗?`,
                              primaryAction: {
                                title: '删除',
                                style: Alert.ActionStyle.Destructive,
                              },
                            });
                            if (confirmed) {
                              await deleteRequirement(req.id);
                            }
                          }}
                        />
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        ),
      )}
    </List>
  );
}
