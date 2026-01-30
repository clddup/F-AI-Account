# 🚀 Antigravity Key

一个基于 FOFA API 的 Antigravity Console 账号信息批量导出工具。

## ✨ 功能特性

- 🔍 通过 FOFA API 搜索 `title="Antigravity Console"` 的目标
- 📦 批量导出账号信息（邮箱和 refresh_token）
- ⚡ 支持并发请求，提高效率
- 📊 实时进度条显示
- 🎨 美观的命令行界面
- 🛡️ 完善的错误处理机制

## 📋 环境要求

- [Bun](https://bun.sh/) 运行时环境
- FOFA API Key（从 [FOFA 用户中心](https://fofa.info/userInfo) 获取）

## 🔧 安装

```bash
# 克隆项目
git clone <repository-url>
cd Antigravity-Key

# 安装依赖
bun install
```

## ⚙️ 配置

### 方式一：环境变量

```bash
export FOFA_KEY="your_fofa_key_here"
export FOFA_SIZE="100"              # 可选，默认为 100
export CONCURRENCY_LIMIT="10"       # 可选，并发数，默认为 10
```

### 方式二：.env 文件（推荐）

在项目根目录创建 `.env` 文件：

```bash
FOFA_KEY=your_fofa_key_here
FOFA_SIZE=100
CONCURRENCY_LIMIT=10
```

**配置说明：**

- `FOFA_KEY`：必填，您的 FOFA API Key
- `FOFA_SIZE`：可选，每次查询返回的结果数量（默认：100）
- `CONCURRENCY_LIMIT`：可选，并发请求数量（默认：10）

## 🚀 使用方法

```bash
bun start
```

程序将自动：
1. 使用 FOFA API 搜索 Antigravity Console
2. 并发访问所有找到的链接
3. 导出账号信息（邮箱和 refresh_token）
4. 显示实时进度和统计信息

## 📊 输出示例

程序会输出找到的账号信息，格式如下：

```
邮箱: example@email.com
Refresh Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🛠️ 技术栈

- **运行时**：Bun
- **语言**：TypeScript
- **依赖库**：
  - `chalk` - 终端颜色输出
  - `cfonts` - ASCII 艺术字
  - `async` - 异步流程控制
  - `progress` - 进度条显示

## 📝 注意事项

- 请遵守 Fofa 的使用政策和相关法律法规。
- 免费代理的稳定性和安全性无法保证，请谨慎使用。
- 本项目仅用于学习和研究目的，请勿用于非法用途。

## ⚠️ 免责声明

本项目仅供学习、研究和个人非商业用途，开发者不对因使用本项目而导致的任何直接或间接损失承担责任。用户在使用本项目时，应自行承担所有风险，并确保遵守所有有适用的法律法规。本项目不鼓励、不纵容任何非法活动。
