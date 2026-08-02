# API 接口文档

本文档介绍系统的核心 API 接口规范。

## 认证接口

### 登录接口

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

**响应示例：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

## 数据接口

### 获取用户列表

```
GET /api/users?page=1&pageSize=10
Authorization: Bearer <token>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页条数，默认10 |

> 注意：所有接口都需要在请求头中携带有效的 Token
