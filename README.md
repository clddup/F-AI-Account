# F-AI-Account

基于 FOFA 网络空间搜索引擎的 AI 服务凭证批量提取工具集，使用 Bun + TypeScript 构建。

## 前置要求

- [Bun](https://bun.sh/) 运行时
- [FOFA](https://fofa.info/) API Key

## 安装

```bash
bun install
```

## 配置

复制 `.env` 文件并填入你的 FOFA Key：

```env
FOFA_KEY=your_fofa_key_here
CONCURRENCY_LIMIT=20
FOFA_SIZE=500
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `FOFA_KEY` | FOFA API 密钥（必填） | - |
| `FOFA_SIZE` | FOFA 查询结果数量 | `100` |
| `CONCURRENCY_LIMIT` | 并发请求数 | `10` |

## 模块

| 模块 | 说明 |
|------|------|
| [Antigravity](src/antigravity/README.md) | Antigravity Console 账号导出 |
| [Kiro](src/kiro/README.md) | Kiro API 账号导出 |
| [AIClient2API](src/aiclient2api/README.md) | AIClient2API 凭证提取 |

## 项目结构

```
src/
├── common/           # 公共模块（配置、日志、FOFA、进度条、Banner）
├── antigravity/      # Antigravity 模块
├── kiro/             # Kiro 模块
└── aiclient2api/     # AIClient2API 模块
```
