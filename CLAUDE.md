# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Numerbook Calculator - 一个现代化的文本式实时计算器。用户在文本框中输入计算表达式，每行右侧实时显示结果。

## Tech Stack

- **Pure原生 HTML/CSS/JS** - 零依赖，单文件部署
- **字体**: Inter (正文) + JetBrains Mono (代码)
- **部署**: Vercel

## Commands

```bash
# 运行测试
node test-node.js

# 本地开发
# 直接用浏览器打开 index.html 即可
```

## Architecture

```
index.html          # 主界面 + UI 逻辑 (IIFE 模式)
calculator.js       # 计算器核心逻辑 (可独立测试)
test-node.js        # Node.js 测试脚本
test.html           # 浏览器测试套件
```

### calculator.js 模块结构

| 模块 | 说明 |
|------|------|
| Tokenizer | 词法分析，支持数字、标识符、运算符 |
| Parser | 递归下降语法分析，生成 AST |
| Evaluator | AST 求值，变量管理 (VariableScope) |
| Calculator | 对外 API (tokenize, parse, evaluate, reset, getVariables) |

### 语法定义

```bnf
assignment  ::= identifier "=" expression
expression  ::= term (("+" | "-") term)*
term        ::= factor (("*" | "/") factor)*
exponent    ::= factor ("^" factor)*  (右结合)
factor      ::= number | identifier | "(" expression ")" | unary
unary       ::= "-" factor
```

### 支持的功能

- 四则运算 `+` `-` `*` `/`
- 幂运算 `^`
- 变量赋值与引用 `a = 10`, `b = a + 5`
- 中文变量名支持
- 除零错误、未定义变量错误处理

## IIFE 模式

`index.html` 中的 `app` 对象使用 IIFE 模式组织代码：

```javascript
const app = (function() {
  // 私有变量和函数
  function init() { ... }
  function render() { ... }

  // 公开 API
  return {
    init,
    handleLineInput,
    handleLineKeydown,
    ...
  };
})();
```

## 测试模式

- 测试在 `test-node.js` 中使用 CommonJS (`require('./calculator.js')`)
- 在浏览器中通过 `window.Calculator` 访问

## 国内部署

待办：部署到 Gitee Pages 或 Cloudflare Pages 以优化国内访问速度。

## 部署约定

当用户说"部署"时，默认部署到 **Vercel**（使用 `vercel --prod` 命令）。
