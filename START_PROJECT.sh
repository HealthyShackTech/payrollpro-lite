#!/bin/bash

# 启动 PayrollPro 项目的脚本

echo "🚀 正在启动 PayrollPro 项目..."
echo ""

# 检查后端依赖
echo "📦 检查后端依赖..."
if [ ! -d "server/node_modules" ]; then
    echo "安装后端依赖..."
    cd server
    npm install
    cd ..
fi

# 检查前端依赖
echo "📦 检查前端依赖..."
if [ ! -d "client/node_modules" ]; then
    echo "安装前端依赖..."
    cd client
    npm install
    cd ..
fi

# 启动后端服务器
echo ""
echo "🔧 启动后端服务器 (端口 5001)..."
cd server
node server.js &
SERVER_PID=$!
cd ..

# 等待服务器启动
sleep 3

# 启动前端应用
echo ""
echo "🎨 启动前端应用 (端口 3000)..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ 项目已启动！"
echo ""
echo "📝 后端服务器: http://localhost:5001"
echo "📝 前端应用: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""
echo "进程 ID:"
echo "  后端: $SERVER_PID"
echo "  前端: $CLIENT_PID"
echo ""
echo "要停止服务，运行: kill $SERVER_PID $CLIENT_PID"

# 等待用户中断
wait




