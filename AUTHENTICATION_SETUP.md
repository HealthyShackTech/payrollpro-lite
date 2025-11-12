# 用户认证系统设置指南

## 概述

系统已从用户注册开始重新设计，现在包含完整的用户认证系统。所有应用路由都受到保护，需要用户登录才能访问。

## 功能特性

### 后端功能
- ✅ 用户注册（邮箱验证、密码加密）
- ✅ 用户登录（JWT 令牌认证）
- ✅ 令牌验证
- ✅ 用户资料管理
- ✅ 密码修改
- ✅ 认证中间件保护 API 路由

### 前端功能
- ✅ 注册页面
- ✅ 登录页面
- ✅ 路由保护（ProtectedRoute）
- ✅ 全局认证状态管理（AuthContext）
- ✅ 自动 token 注入（axios 拦截器）
- ✅ 自动 token 过期处理
- ✅ Header 显示用户信息和登出功能

## 安装依赖

### 后端依赖
```bash
cd server
npm install
```

确保安装了以下新依赖：
- `bcrypt` - 密码加密
- `jsonwebtoken` - JWT 令牌生成和验证

### 前端依赖
前端依赖已包含在现有 `package.json` 中，无需额外安装。

## 环境变量配置

在 `server/.env` 文件中添加以下配置：

```env
# MongoDB 配置
MONGO_URI=your_mongodb_connection_string
DB_NAME=payrollpro

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=5001
CORS_ORIGIN=http://localhost:3000

# Session 配置
SESSION_SECRET=your-session-secret-key
```

## 数据库结构

系统会自动创建 `users` 集合，包含以下字段：

```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  password: String (hashed),
  firstName: String,
  lastName: String,
  companyName: String (optional),
  role: String (default: 'admin'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

## API 端点

### 认证端点

- `POST /api/auth/register` - 用户注册
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Company Name" // 可选
  }
  ```

- `POST /api/auth/login` - 用户登录
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/verify` - 验证令牌（需要 Authorization header）
  ```
  Authorization: Bearer <token>
  ```

- `GET /api/auth/profile` - 获取用户资料（需要认证）

- `PUT /api/auth/profile` - 更新用户资料（需要认证）

- `PUT /api/auth/change-password` - 修改密码（需要认证）
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }
  ```

## 使用流程

### 1. 用户注册

1. 访问 `/register` 页面
2. 填写注册表单：
   - 名（必填）
   - 姓（必填）
   - 邮箱（必填，必须是有效邮箱格式）
   - 公司名称（可选）
   - 密码（必填，至少 6 个字符）
   - 确认密码（必填，必须与密码匹配）
3. 点击"Create Account"按钮
4. 注册成功后自动跳转到登录页面

### 2. 用户登录

1. 访问 `/login` 页面
2. 输入邮箱和密码
3. 点击"Login"按钮
4. 登录成功后自动跳转到首页

### 3. 访问受保护的路由

所有应用路由（除了 `/login` 和 `/register`）都受到保护：
- 如果用户未登录，会自动重定向到 `/login`
- 如果用户已登录，可以正常访问所有功能

### 4. 登出

点击 Header 中的"Logout"按钮即可登出，系统会清除 token 并重定向到登录页面。

## 代码结构

### 后端文件
- `server/auth.js` - 认证核心逻辑
- `server/auth-routes.js` - 认证路由
- `server/auth-middleware.js` - 认证中间件
- `server/server.js` - 服务器配置（已更新）

### 前端文件
- `client/src/components/Login.js` - 登录页面
- `client/src/components/Register.js` - 注册页面
- `client/src/components/ProtectedRoute.js` - 路由保护组件
- `client/src/contexts/AuthContext.js` - 认证上下文
- `client/src/utils/axiosConfig.js` - Axios 配置（自动 token 注入）
- `client/src/index.js` - 路由配置（已更新）

## 安全特性

1. **密码加密**：使用 bcrypt 进行密码哈希
2. **JWT 令牌**：使用 JSON Web Tokens 进行认证
3. **令牌过期**：令牌默认 7 天过期
4. **自动刷新**：前端自动验证令牌有效性
5. **路由保护**：所有敏感路由都需要认证
6. **API 保护**：后端 API 可以添加认证中间件保护

## 在现有组件中使用认证

### 使用 AuthContext

```javascript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // 使用用户信息
  console.log(user?.firstName);
  
  // 检查认证状态
  if (isAuthenticated) {
    // 执行需要认证的操作
  }
};
```

### 使用 API 请求（自动包含 token）

```javascript
import api from '../utils/axiosConfig';

// GET 请求（自动包含 token）
const response = await api.get('/api/employees');

// POST 请求（自动包含 token）
const response = await api.post('/api/employees', employeeData);

// PUT 请求（自动包含 token）
const response = await api.put(`/api/employees/${id}`, updateData);

// DELETE 请求（自动包含 token）
await api.delete(`/api/employees/${id}`);
```

## 保护后端 API 路由

如果需要保护后端 API 路由，使用认证中间件：

```javascript
const { authenticateToken } = require('./auth-middleware');

// 保护单个路由
app.get('/api/protected-route', authenticateToken, async (req, res) => {
  // req.user 包含用户信息
  res.json({ message: 'Protected data', user: req.user });
});

// 保护多个路由
app.use('/api/protected', authenticateToken);
```

## 故障排除

### 问题：无法登录
- 检查邮箱格式是否正确
- 检查密码是否至少 6 个字符
- 检查后端服务器是否运行
- 检查 MongoDB 连接是否正常

### 问题：令牌过期
- 系统会自动处理令牌过期，重定向到登录页面
- 可以修改 `JWT_EXPIRES_IN` 环境变量来调整过期时间

### 问题：API 请求失败（401）
- 检查 token 是否在 localStorage 中
- 检查 token 是否过期
- 检查后端 JWT_SECRET 配置是否正确

## 下一步

系统现在已经完整地从用户注册开始重新设计。所有功能都已实现并可以正常使用。

如果需要进一步定制：
1. 可以修改用户角色系统
2. 可以添加更多用户资料字段
3. 可以添加密码重置功能
4. 可以添加邮箱验证功能

