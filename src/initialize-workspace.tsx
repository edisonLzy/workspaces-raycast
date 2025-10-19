import React from 'react';
import {
  Action,
  ActionPanel,
  Detail,
  getPreferenceValues,
} from '@raycast/api';
import { useEffect, useState } from 'react';
import {
  useInitializeWorkspace,
  type InitializationResult,
} from './hooks/useInitializeWorkspace';
import type { Preferences } from './types';

export default function InitializeWorkspace() {
  const { workspaceRoot } = getPreferenceValues<Preferences>();
  const initializeWorkspace = useInitializeWorkspace();
  const [result, setResult] = useState<InitializationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await initializeWorkspace();
        setResult(res);
      } catch (error) {
        // Error is already handled in the hook with Toast
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [initializeWorkspace]);

  if (isLoading) {
    return <Detail markdown="正在初始化工作目录..." />;
  }

  if (!result) {
    return (
      <Detail
        markdown="# 初始化失败\n\n请查看错误提示信息。"
        actions={
          <ActionPanel>
            <Action.Open title="打开工作目录" target={workspaceRoot} />
          </ActionPanel>
        }
      />
    );
  }

  // 分类显示创建和已存在的项目
  const createdItems = result.items.filter((item) => item.created);
  const existingItems = result.items.filter((item) => !item.created);

  let markdown = '# 工作目录初始化完成\n\n';

  if (createdItems.length > 0) {
    markdown += '## ✅ 新创建的文件和目录\n\n';
    createdItems.forEach((item) => {
      const icon = item.type === 'directory' ? '📁' : '📄';
      markdown += `- ${icon} **${item.name}**\n  \`${item.path}\`\n\n`;
    });
  }

  if (existingItems.length > 0) {
    markdown += '## ℹ️ 已存在的文件和目录\n\n';
    existingItems.forEach((item) => {
      const icon = item.type === 'directory' ? '📁' : '📄';
      markdown += `- ${icon} **${item.name}**\n  \`${item.path}\`\n\n`;
    });
  }

  markdown += `\n---\n\n**工作目录:** \`${result.workspaceRoot}\`\n\n`;
  markdown += '现在你可以开始管理你的开发需求了！';

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.Open title="打开工作目录" target={workspaceRoot} />
          <Action.ShowInFinder
            title="在 Finder 中显示"
            path={workspaceRoot}
          />
        </ActionPanel>
      }
    />
  );
}
