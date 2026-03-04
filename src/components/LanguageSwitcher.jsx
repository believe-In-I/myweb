import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

/**
 * 语言切换组件
 * 提供中英文切换功能
 */
const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  // 语言选项
  const languages = [
    { key: 'zh-CN', label: '中文' },
    { key: 'en-US', label: 'English' },
  ];

  // 点击切换语言
  const handleClick = ({ key }) => {
    i18n.changeLanguage(key);
  };

  // 构建菜单项
  const items = languages.map((lang) => ({
    key: lang.key,
    label: lang.label,
  }));

  // 当前语言显示
  const currentLang = languages.find((l) => l.key === i18n.language) || languages[0];

  return (
    <Dropdown
      menu={{ items, onClick: handleClick }}
      trigger={['click']}
      placement="bottomRight"
    >
      <Space style={{ cursor: 'pointer' }}>
        <GlobalOutlined />
        <span>{currentLang.label}</span>
      </Space>
    </Dropdown>
  );
};

export default LanguageSwitcher;
