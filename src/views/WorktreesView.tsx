import React from 'react';
import { List, ActionPanel, Action, Icon } from '@raycast/api';
import { useOpenInEditor, useShowInFinder } from '../hooks/useEditor';
import { useRemoveWorktree } from '../hooks/useGitOperations';
import { WorktreeCreateForm } from './WorktreeCreateForm';
import type { Requirement, WorktreeInfo } from '../types';

/**
 * 工作区列表视图
 * 展示指定需求下的所有工作区
 */
export function WorktreesView({ requirement }: { requirement: Requirement }) {
  const worktrees = requirement.worktrees || [];
  const deadline = new Date(requirement.deadline);
  const deadlineStr = deadline.toLocaleDateString('zh-CN');

  const openInEditor = useOpenInEditor();
  const showInFinder = useShowInFinder();
  const removeWorktree = useRemoveWorktree();

  return (
    <List navigationTitle={requirement.name} searchBarPlaceholder="搜索工作区...">
      <List.Section title="需求信息">
        <List.Item title="迭代版本" accessories={[{ text: requirement.iteration }]} />
        <List.Item title="截止时间" accessories={[{ text: deadlineStr, icon: Icon.Calendar }]} />
        {requirement.context.length > 0 && (
          <List.Item
            title="上下文文档"
            accessories={[{ text: `${requirement.context.length} 个文档` }]}
            actions={
              <ActionPanel>
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
              </ActionPanel>
            }
          />
        )}
      </List.Section>

      <List.Section title={`工作区 (${worktrees.length})`}>
        {worktrees.length === 0 ? (
          <List.Item
            title="暂无工作区"
            subtitle="按 Cmd+N 创建新的工作区"
            actions={
              <ActionPanel>
                <Action.Push
                  title="创建 Worktree"
                  icon={Icon.Plus}
                  shortcut={{ modifiers: ['cmd'], key: 'n' }}
                  target={<WorktreeCreateForm requirement={requirement} />}
                />
              </ActionPanel>
            }
          />
        ) : (
          worktrees.map((worktree: WorktreeInfo, idx: number) => (
            <List.Item
              key={idx}
              title={worktree.label}
              subtitle={worktree.branch}
              accessories={[
                { text: worktree.repository, icon: Icon.Box },
                { tag: { value: 'worktree', color: '#4CAF50' } },
              ]}
              actions={
                <ActionPanel>
                  <ActionPanel.Section title="工作区操作">
                    <Action
                      title="在编辑器中打开"
                      icon={Icon.Code}
                      shortcut={{ modifiers: ['cmd'], key: 'o' }}
                      onAction={async () => {
                        await openInEditor(worktree.path);
                      }}
                    />
                    <Action
                      title="在 Finder 中显示"
                      icon={Icon.Finder}
                      shortcut={{ modifiers: ['cmd'], key: 'f' }}
                      onAction={async () => {
                        await showInFinder(worktree.path);
                      }}
                    />
                    <Action.CopyToClipboard
                      title="复制路径"
                      content={worktree.path}
                      shortcut={{ modifiers: ['cmd'], key: 'c' }}
                    />
                    <Action.CopyToClipboard
                      title="复制分支名"
                      content={worktree.branch}
                      shortcut={{ modifiers: ['cmd', 'shift'], key: 'c' }}
                    />
                  </ActionPanel.Section>

                  <ActionPanel.Section title="管理">
                    <Action.Push
                      title="创建新 Worktree"
                      icon={Icon.Plus}
                      shortcut={{ modifiers: ['cmd'], key: 'n' }}
                      target={<WorktreeCreateForm requirement={requirement} />}
                    />
                    <Action
                      title="删除此 Worktree"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={{ modifiers: ['cmd'], key: 'delete' }}
                      onAction={async () => {
                        await removeWorktree(requirement.id, worktree.path, worktree.path);
                      }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))
        )}
      </List.Section>
    </List>
  );
}
