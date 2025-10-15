import React, { useState } from 'react';
import { Form, ActionPanel, Action, Icon, confirmAlert, useNavigation } from '@raycast/api';
import { useCreateWorktree } from '../hooks/useGitOperations';
import { useGenerateBranchName, convertToKebabCase } from '../hooks/useClaudeCode';
import { useOpenInEditor } from '../hooks/useEditor';
import { useValidateBranchName } from '../hooks/useGitRepository';
import type { Requirement } from '../types';

/**
 * 创建 Worktree 表单
 * 用于为指定需求创建新的工作区
 */
export function WorktreeCreateForm({ requirement }: { requirement: Requirement }) {
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
          <Action title="生成分支名" icon={Icon.Wand} onAction={handleGenerateBranchName} />
        </ActionPanel>
      }
    >
      <Form.Description title="需求信息" text={`${requirement.iteration} - ${requirement.name}`} />
      <Form.Separator />
      <Form.TextField id="label" title="Worktree 标签" placeholder="主分支" value={label} onChange={setLabel} />
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
