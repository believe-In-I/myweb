# 前端开发规范

本文档定义了前端开发中的代码规范和最佳实践。

## 目录结构

```
src/
├── components/     # 公共组件
├── pages/          # 页面组件
├── hooks/          # 自定义 Hooks
├── utils/          # 工具函数
├── services/       # API 服务
└── styles/         # 全局样式
```

## React 组件规范

### 命名规范

- 组件文件使用 PascalCase 命名
- 组件名使用 PascalCase
- Hooks 使用 camelCase 并以 use 开头

### 示例代码

```jsx
// 正确示例
const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  return <div>{user?.name}</div>;
};

// 错误示例
const user_profile = () => {
  const [user, setuser] = useState(null);
  return <div>{user.name}</div>;
};
```

## Git 提交规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建或辅助工具
