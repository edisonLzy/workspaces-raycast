import React, { useState } from 'react';
import {
  List,
  ActionPanel,
  Action,
  Icon,
  confirmAlert,
  Alert,
  Form,
  useNavigation,
} from '@raycast/api';
import {
  useGroupedRequirements,
  useDeleteRequirement,
} from './hooks/useRequirements';
import { useCreateWorktree, useRemoveWorktree } from './hooks/useGitOperations';
import {
  useGenerateBranchName,
  convertToKebabCase,
} from './hooks/useClaudeCode';
import { useOpenInEditor, useShowInFinder } from './hooks/useEditor';
import { useValidateBranchName } from './hooks/useGitRepository';
import type { Requirement, WorktreeInfo } from './types';

export default function ViewRequirements() {
  const { data: groupedRequirements, isLoading } = useGroupedRequirements();
  const deleteRequirement = useDeleteRequirement();

  return (
    <List isLoading={isLoading} searchBarPlaceholder="搜索需求或迭代...">
      {Array.from(groupedRequirements.entries()).map(([iteration, reqs]) => (
        <List.Section key={iteration} title={`迭代 ${iteration}`}>
          {reqs.map((req: Requirement) => (
            <RequirementListItem
              key={req.id}
              requirement={req}
              onDelete={deleteRequirement}
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

interface RequirementListItemProps {
  requirement: Requirement;
  onDelete: (id: string) => Promise<void>;
}

function RequirementListItem({
  requirement,
  onDelete,
}: RequirementListItemProps) {
  const worktreeCount = requirement.worktrees?.length || 0;
  const deadline = new Date(requirement.deadline);
  const deadlineStr = deadline.toLocaleDateString('zh-CN');

  const accessories: List.Item.Accessory[] = [
    { text: `${worktreeCount} worktree(s)`, icon: Icon.CodeBlock },
    { text: `截止: ${deadlineStr}`, icon: Icon.Calendar },
  ];

  return (
    <List.Item
      title={requirement.name}
      subtitle={requirement.iteration}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="需求详情">
            <Action.Push
              title="查看工作区"
              icon={Icon.AppWindow}
              target={<RequirementDetail requirement={requirement} />}
            />
          </ActionPanel.Section>

          {requirement.context.length > 0 && (
            <ActionPanel.Section title="上下文">
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

          <ActionPanel.Section title="管理">
            <Action
              title="删除需求"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ['cmd', 'shift'], key: 'd' }}
              onAction={async () => {
                const confirmed = await confirmAlert({
                  title: '删除需求',
                  message: `确定要删除需求 "${requirement.name}" 吗?`,
                  primaryAction: {
                    title: '删除',
                    style: Alert.ActionStyle.Destructive,
                  },
                });
                if (confirmed) {
                  await onDelete(requirement.id);
                }
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

/**
 * 需求详情 / 工作区列表界面
 * 展示该需求下的所有 worktree,并提供相关操作
 */
interface RequirementDetailProps {
  requirement: Requirement;
}

function RequirementDetail({ requirement }: RequirementDetailProps) {
  const worktrees = requirement.worktrees || [];
  const deadline = new Date(requirement.deadline);
  const deadlineStr = deadline.toLocaleDateString('zh-CN');

  return (
    <List
      navigationTitle={requirement.name}
      searchBarPlaceholder="搜索工作区..."
    >
      <List.Section title="需求信息">
        <List.Item
          title="迭代版本"
          accessories={[{ text: requirement.iteration }]}
        />
        <List.Item
          title="截止时间"
          accessories={[{ text: deadlineStr, icon: Icon.Calendar }]}
        />
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
                  target={<CreateWorktreeForm requirement={requirement} />}
                />
              </ActionPanel>
            }
          />
        ) : (
          worktrees.map((worktree, idx) => (
            <WorktreeListItem
              key={idx}
              requirement={requirement}
              worktree={worktree}
            />
          ))
        )}
      </List.Section>
    </List>
  );
}

/**
 * Worktree 列表项
 * 提供打开、删除等操作
 */
interface WorktreeListItemProps {
  requirement: Requirement;
  worktree: WorktreeInfo;
}

function WorktreeListItem({ requirement, worktree }: WorktreeListItemProps) {
  const openInEditor = useOpenInEditor();
  const showInFinder = useShowInFinder();
  const removeWorktree = useRemoveWorktree();

  return (
    <List.Item
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
              target={<CreateWorktreeForm requirement={requirement} />}
            />
            <Action
              title="删除此 Worktree"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ['cmd'], key: 'delete' }}
              onAction={async () => {
                await removeWorktree(
                  requirement.id,
                  worktree.path,
                  worktree.path,
                );
              }}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

/**
 * 创建 Worktree 表单
 */
interface CreateWorktreeFormProps {
  requirement: Requirement;
}

function CreateWorktreeForm({ requirement }: CreateWorktreeFormProps) {
  const { pop } = useNavigation();
  const createWorktree = useCreateWorktree();
  const generateBranchName = useGenerateBranchName();
  const validateBranchName = useValidateBranchName();
  const openInEditor = useOpenInEditor();

  const [label, setLabel] = useState('主分支');
  const [repoPath, setRepoPath] = useState('');
  const [branchName, setBranchName] = useState('');
  const [repository, setRepository] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerateBranchName() {
    setIsGenerating(true);
    try {
      const generated = await generateBranchName(requirement.name);
      if (generated) {
        setBranchName(generated);
      } else {
        // Claude Code 不可用,使用简单的转换
        const fallback = convertToKebabCase(requirement.name);
        setBranchName(fallback);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSubmit(values: {
    label: string;
    repoPath: string;
    branchName: string;
    repository: string;
  }) {
    // 验证分支名
    const validation = validateBranchName(values.branchName);
    if (!validation.valid) {
      await confirmAlert({
        title: '分支名无效',
        message: validation.message,
      });
      return;
    }

    const worktreePath = await createWorktree({
      requirementId: requirement.id,
      repoPath: values.repoPath,
      branch: values.branchName,
      label: values.label,
      repository: values.repository,
    });

    if (worktreePath) {
      await openInEditor(worktreePath);
      pop();
    }
  }

  return (
    <Form
      isLoading={isGenerating}
      navigationTitle="创建 Worktree"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="创建 Worktree" onSubmit={handleSubmit} />
          <Action
            title="生成分支名"
            icon={Icon.Wand}
            onAction={handleGenerateBranchName}
          />
        </ActionPanel>
      }
    >
      <Form.Description
        title="需求信息"
        text={`${requirement.iteration} - ${requirement.name}`}
      />
      <Form.Separator />
      <Form.TextField
        id="label"
        title="Worktree 标签"
        placeholder="主分支"
        value={label}
        onChange={setLabel}
      />
      <Form.FilePicker
        id="repoPath"
        title="仓库路径"
        allowMultipleSelection={false}
        canChooseDirectories
        canChooseFiles={false}
        value={repoPath ? [repoPath] : []}
        onChange={(paths) => setRepoPath(paths[0] || '')}
      />
      <Form.TextField
        id="branchName"
        title="分支名称"
        placeholder="feature/user-login-refactor"
        value={branchName}
        onChange={setBranchName}
      />
      <Form.TextField
        id="repository"
        title="仓库名称"
        placeholder="user-center"
        value={repository}
        onChange={setRepository}
      />
    </Form>
  );
}
