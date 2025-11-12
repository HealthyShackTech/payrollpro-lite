# 快速启动指南

## 从用户注册开始的完整系统重构

系统已从用户注册开始重新设计，包含完整的用户认证系统。

## 快速启动步骤

### 1. 安装后端依赖

```bash
cd server
npm install
```

这会安装所有必要的依赖，包括新添加的 `bcrypt` 和 `jsonwebtoken`。

### 2. 配置环境变量

在 `server/.env` 文件中添加：

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=payrollpro
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=5001
CORS_ORIGIN=http://localhost:3000
SESSION_SECRET=your-session-secret-key
```

### 3. 启动后端服务器

```bash
cd server
node server.js
```

服务器将在 `http://localhost:5001` 启动。

### 4. 启动前端应用

在新的终端窗口中：

```bash
cd client
npm start
```

前端应用将在 `http://localhost:3000` 启动。

### 5. 使用应用

1. **首次使用**：访问 `http://localhost:3000/register` 创建账户
2. **登录**：访问 `http://localhost:3000/login` 登录
3. **使用系统**：登录后可以访问所有功能

## 主要改进

✅ **完整的用户认证系统**
- 用户注册
- 用户登录
- JWT 令牌认证
- 自动令牌验证

✅ **路由保护**
- 所有应用路由需要认证
- 未认证用户自动重定向到登录页

✅ **统一的 API 请求**
- Axios 拦截器自动添加 token
- 自动处理令牌过期
- 统一的错误处理

✅ **改进的用户体验**
- 欢迎消息显示用户信息
- Header 显示当前登录用户
- 一键登出功能

## 新功能

### 用户注册
- 邮箱验证
- 密码强度要求（最少 6 个字符）
- 密码确认验证
- 公司名称（可选）

### 用户登录
- 安全的密码验证
- JWT 令牌生成
- 自动会话管理

### 路由保护
- 所有路由自动保护
- 未认证用户自动重定向
- 令牌过期自动处理

## 文件结构

### 后端新增文件
- `server/auth.js` - 认证核心逻辑
- `server/auth-routes.js` - 认证路由
- `server/auth-middleware.js` - 认证中间件

### 前端新增文件
- `client/src/components/Login.js` - 登录页面
- `client/src/components/Register.js` - 注册页面
- `client/src/components/ProtectedRoute.js` - 路由保护
- `client/src/components/Auth.css` - 认证样式
- `client/src/contexts/AuthContext.js` - 认证上下文
- `client/src/utils/axiosConfig.js` - Axios 配置

### 更新的文件
- `server/server.js` - 集成认证系统
- `client/src/index.js` - 更新路由和 Header
- `client/src/components/Homepage.js` - 使用新的认证系统
- `client/src/styles.css` - 添加用户菜单样式

## 下一步

系统现在已经完整地从用户注册开始重新设计。所有功能都已实现并可以正常使用。

如果需要进一步定制，请参考 `AUTHENTICATION_SETUP.md` 获取详细文档。

