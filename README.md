# LiblibAI n8n 节点

这是一个 n8n 社区节点，用于集成 LiblibAI 星流 Star-3 Alpha AI 图片生成服务。

## 功能特性

- 🎨 **文生图 (Text-to-Image)**: 根据文字描述生成高质量图片
- 🖼️ **图生图 (Image-to-Image)**: 基于参考图片生成新图片
- 🎮 **ControlNet 支持**: 精准控制图片构图、风格和细节
- 🔍 **状态查询**: 实时查询生图任务执行状态
- ⏱️ **异步处理**: 智能轮询机制，支持长时间生图任务
- 🔐 **安全认证**: 完整的 HMAC-SHA1 签名认证
- 🎛️ **优化界面**: 简洁的参数设置，支持高级选项开关控制

## 安装方法

### 方法一：通过 n8n 社区节点面板安装

1. 进入 n8n 实例的设置页面
2. 选择 "社区节点"
3. 点击 "安装社区节点"
4. 输入 `n8n-nodes-liblibai`
5. 点击 "安装"

### 方法二：通过 npm 手动安装

```bash
# 在 n8n 根目录执行
npm install n8n-nodes-liblibai
```

### 方法三：开发模式安装

```bash
# 克隆项目
git clone https://github.com/your-username/n8n-nodes-liblibai.git
cd n8n-nodes-liblibai

# 安装依赖
npm install

# 构建项目
npm run build

# 链接到 n8n（开发模式）
npm link
cd /path/to/your/n8n
npm link n8n-nodes-liblibai
```

## 配置指南

### 1. 获取 API 密钥

1. 访问 [LiblibAI 官网](https://www.liblib.art/apis) 注册登录
2. 进入开放平台申请 API 试用积分或购买 API 积分
3. 获取 `Access Key` 和 `Secret Key`

### 2. 配置凭据

1. 在 n8n 中新建 LiblibAI 凭据
2. 填入获取的 Access Key 和 Secret Key
3. Base URL 保持默认值: `https://openapi.liblibai.cloud`

## 使用示例

### 基础文生图工作流

```
Webhook → LiblibAI (文生图) → 发送邮件
```

**LiblibAI 节点配置:**
- 操作类型: 文生图
- 提示词: "1 girl, masterpiece, best quality, beautiful portrait"
- 图片比例: 肖像 (3:4)
- 生成数量: 1

### 图生图工作流

```
HTTP Request → LiblibAI (图生图) → 保存到云存储
```

**LiblibAI 节点配置:**
- 操作类型: 图生图
- 提示词: "transform into anime style, colorful"
- 参考图片URL: 从上一步获取的图片链接
- 高级设置: 开启 → 启用ControlNet → 类型选择"风格迁移"

### 批量处理工作流

```
读取表格 → 分割批次 → LiblibAI (文生图) → 合并结果 → 输出
```

## 节点参数详解

### 操作类型

| 操作 | 描述 | 输入 | 输出 |
|------|------|------|------|
| 文生图 | 根据文字描述生成图片 | 提示词 | 生成的图片 |
| 图生图 | 基于参考图片生成新图片 | 提示词 + 参考图片 | 生成的图片 |
| 查询状态 | 查询生图任务执行状态 | 任务UUID | 状态信息 |

### 尺寸设置

- **预设比例**:
  - 方形 (1:1, 1024×1024) - 适合头像、logo
  - 肖像 (3:4, 768×1024) - 适合人物肖像
  - 横屏 (16:9, 1280×720) - 适合风景画幅

- **自定义尺寸**: 宽度和高度范围 512-2048 像素

### 高级设置

**高级设置开关**: 控制是否显示高级参数
- **采样步数**: 生图质量控制 (10-100，推荐30)
- **启用ControlNet**: 开启构图控制功能
  - **ControlNet类型**: 控制类型选择
  - **ControlNet参考图**: 参考图片URL

### ControlNet 功能

| 类型 | 功能 | 适用场景 |
|------|------|----------|
| 线稿轮廓 (Line) | 保持图片线条结构 | 线稿上色 |
| 空间关系 (Depth) | 保持深度和空间布局 | 场景重构 |
| 人物姿态 (Pose) | 保持人物姿势和动作 | 人物换装 |
| 风格迁移 (IPAdapter) | 迁移参考图片风格 | 风格转换 |
| 主体参考 (Subject) | 参考图片中的主体 | 角色生成 |

### 异步执行设置

- **等待任务完成**: 是否等待生图完成后返回结果
- **最大等待时间**: 30 秒 - 30 分钟 (当等待完成时显示)
- **轮询间隔**: 检查任务状态的频率 (当等待完成时显示)

## 错误处理

### 常见错误及解决方案

| 错误信息 | 原因 | 解决方法 |
|----------|------|----------|
| "认证失败" | API 密钥错误 | 检查 Access Key 和 Secret Key |
| "提示词不能为空" | 未填写提示词 | 填写英文提示词 |
| "图片URL格式不正确" | 参考图片链接无效 | 使用有效的图片 URL |
| "任务轮询超时" | 生图时间过长 | 增加最大等待时间 |
| "积分不足" | API 积分用完 | 购买更多 API 积分 |
| "当前进行中任务数量已达到并发任务上限" | API并发限制 | 等待当前任务完成后重试 |

## 最佳实践

### 1. 提示词优化

```
✅ 好的提示词:
"1 girl, beautiful face, masterpiece, best quality, highly detailed, 8k wallpaper, anime style"

❌ 避免的提示词:
"一个女孩" (使用中文)
"girl" (过于简单)
```

### 2. 性能优化

- 合理设置轮询间隔，避免过于频繁的请求
- 批量处理时控制并发数量，避免达到 API 限制
- 对于长时间任务，可以先提交任务再定时查询状态

### 3. 错误处理

- 开启 "继续执行" 选项处理单个项目的错误
- 使用 IF 节点检查生图结果的成功状态
- 设置合理的超时时间

## API 限制

- **并发数**: 默认 5 个同时进行的生图任务
- **QPS**: 发起生图任务 1 次/秒，查询状态无限制
- **图片尺寸**: 512×512 到 2048×2048 像素
- **生成数量**: 1-4 张/次

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 代码格式化
npm run format

# 代码检查
npm run lint

# 构建项目
npm run build
```

### 项目结构

```
n8n-nodes-liblibai/
├── credentials/           # 凭据定义
├── nodes/LiblibAI/       # 节点实现
├── types/                # 类型定义
├── utils/                # 工具函数
├── package.json          # 项目配置
└── README.md            # 项目说明
```

## 版本历史

- **v1.0.1**: 界面优化更新
  - 优化节点参数界面，简化配置流程
  - 修复图生图API参数格式问题
  - 添加高级设置开关控制
  - 改进异步执行参数显示逻辑
  - 增加测试用例和调试工具

- **v1.0.0**: 初始版本
  - 支持文生图和图生图功能
  - 完整的 ControlNet 支持
  - 异步任务轮询机制

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 Pull Request

## 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

## 支持

- 📧 邮箱: your.email@example.com
- 🐛 Bug 报告: [GitHub Issues](https://github.com/your-username/n8n-nodes-liblibai/issues)
- 💬 讨论: [GitHub Discussions](https://github.com/your-username/n8n-nodes-liblibai/discussions)

---

⭐ 如果这个项目对你有帮助，请给个 Star！