import React from 'react';
import { Form, ActionPanel, Action, useNavigation, Icon } from '@raycast/api';
import { useForm } from '@raycast/utils';
import { useCreateWorktree } from '../hooks/useGitOperations';
import { useOpenInEditor } from '../hooks/useEditor';
import { useValidateBranchName } from '../hooks/useGitRepository';
import { useGenerateBranchName } from '../hooks/useGenerateBranchName';
import { extractRepoName } from '../utils/path';
import type { Requirement, WorktreeInfo } from '../types';

interface WorktreeCreateFormValues {
  repoPath: string[];
  baseBranch: WorktreeInfo['baseBranch'];
  featureType: WorktreeInfo['featureType'];
  branchName: WorktreeInfo['branch'];
}

/**
 * 创建 Worktree 表单
 * 用于为指定需求创建新的工作区
 */
export function WorktreeCreateForm({ requirement }: { requirement: Requirement }) {
  const { pop } = useNavigation();
  const createWorktree = useCreateWorktree();
  const validateBranchName = useValidateBranchName();
  const openInEditor = useOpenInEditor();
  const { generateBranchName, isGenerating } = useGenerateBranchName(requirement);

  const { handleSubmit, itemProps, values, setValue } = useForm<WorktreeCreateFormValues>({
    async onSubmit(values) {
      const repoPath = values.repoPath[0];
      const repository = extractRepoName(repoPath);

      const worktreePath = await createWorktree({
        requirementId: requirement.id,
        repoPath,
        baseBranch: values.baseBranch,
        branch: values.branchName,
        featureType: values.featureType as 'feat' | 'fix',
        repository,
      });

      if (worktreePath) {
        await openInEditor(worktreePath);
        pop();
      }
    },
    validation: {
      repoPath: (value) => {
        if (!Array.isArray(value) || value.length === 0) {
          return '请选择工作仓库路径';
        }
      },
      baseBranch: (value) => {
        if (!value || !value.trim()) {
          return '基线分支不能为空';
        }
        const validation = validateBranchName(value);
        if (!validation.valid) {
          return validation.message;
        }
      },
      featureType: (value) => {
        if (!value) {
          return '请选择 Feature 类型';
        }
      },
      branchName: (value) => {
        if (!value || !value.trim()) {
          return '分支名称不能为空';
        }
        const validation = validateBranchName(value);
        if (!validation.valid) {
          return validation.message;
        }
      },
    },
    initialValues: {
      repoPath: [],
      baseBranch: 'master',
      featureType: 'feat',
      branchName: '',
    },
  });

  // 处理 AI 生成分支名称
  async function handleGenerateBranchName() {
    const branchName = await generateBranchName(values.featureType as 'feat' | 'fix');
    if (branchName) {
      setValue('branchName', branchName);
    }
  }

  return (
    <Form
      navigationTitle="创建 Worktree"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="创建 Worktree" onSubmit={handleSubmit} />
          <Action
            title="AI 生成分支名"
            icon={Icon.Wand}
            onAction={handleGenerateBranchName}
            shortcut={{ modifiers: ['cmd'], key: 'g' }}
          />
        </ActionPanel>
      }
    >
      <Form.Description title="需求信息" text={`${requirement.iteration} - ${requirement.name}`} />
      <Form.Separator />

      <Form.FilePicker
        title="工作仓库"
        info="选择 Git 仓库所在目录"
        allowMultipleSelection={false}
        canChooseDirectories
        canChooseFiles={false}
        {...itemProps.repoPath}
      />

      <Form.TextField
        title="基线分支"
        placeholder="master"
        info="新分支将基于此分支创建"
        {...itemProps.baseBranch}
      />

      <Form.Dropdown
        id="featureType"
        title="Feature 类型"
        info="选择功能类型: feat(新功能) 或 fix(修复)"
        value={values.featureType}
        onChange={(newValue) => setValue('featureType', newValue as WorktreeInfo['featureType'])}
        error={itemProps.featureType.error}
      >
        <Form.Dropdown.Item value="feat" title="feat - 新功能" />
        <Form.Dropdown.Item value="fix" title="fix - 修复" />
      </Form.Dropdown>

      <Form.TextField
        title="分支名称"
        placeholder="feat/req-123/user-login-refactor"
        info="格式: <featureType>/<需求ID>/<描述> (使用 Cmd+G 快捷键 AI 生成)"
        {...itemProps.branchName}
      />

      {isGenerating && (
        <Form.Description
          title="AI 状态"
          text="正在生成分支名称,请稍候..."
        />
      )}
    </Form>
  );
}
