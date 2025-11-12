const express = require('express');
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const cors = require('cors');  // 引入 CORS
dotenv.config();

const app = express();
app.use(express.json());

// 启用 CORS
app.use(cors());  // 使用 CORS 中间件

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// 连接到 MongoDB 并验证密码
app.post('/authenticate', async (req, res) => {
  const { password } = req.body;

  try {
    // 尝试连接 MongoDB
    console.log('正在尝试连接 MongoDB...');
    await client.connect();
    console.log('MongoDB 连接成功！');

    const db = client.db('company'); // 替换为你的数据库名
    const adminCollection = db.collection('security'); // 替换为你的集合名

    // 获取管理员文档
    const admin = await adminCollection.findOne({ username: "admin" }); // 根据用户名获取文档

    if (admin) {
      // 使用 bcrypt 来比较明文密码和数据库中存储的哈希密码
      const isPasswordCorrect = await bcrypt.compare(password, admin.password);

      if (isPasswordCorrect) {
        // 如果密码正确，生成 JWT token
        const token = jwt.sign({ user: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
      } else {
        res.status(401).json({ message: '密码错误' });
      }
    } else {
      res.status(401).json({ message: '未找到管理员用户' });
    }
  } catch (error) {
    console.error("认证过程中出现错误:", error);
    res.status(500).json({ message: '内部服务器错误' });
  } finally {
    await client.close(); // 请求完成后关闭 MongoDB 客户端
  }
});

app.listen(5003, () => console.log('服务器运行在端口 5003'));
