# Quantization Studio

一个专注于大语言模型量化的在线工具平台，帮助开发者计算最优量化配置、预估模型性能，并连接主流模型仓库。

![Quantization Studio](https://img.shields.io/badge/Version-1.0.0-blue)
![License-MIT](https://img.shields.io/badge/License-MIT-green)

## ✨ 功能特点

- **智能量化计算** - 支持 2-16 位量化位宽，自动计算模型大小、推理速度、显存消耗等指标
- **多方法支持** - 集成 GPTQ、AWQ、GGUF、INT8、FP8 等主流量化方法
- **多 GPU 适配** - 支持 RTX 4090、RTX 4080、A100、L40S 等主流显卡
- **精度预估** - 基于实验数据拟合的精度曲线，估算量化后模型质量损失
- **ModelScope 集成** - 直接搜索和浏览 Hugging Face 生态模型，支持一键量化配置

## 🚀 快速开始

### 在线使用

直接用浏览器打开 `index.html` 即可使用：

```bash
# 克隆项目
git clone https://github.com/yourusername/quantization-studio.git

# 进入项目目录
cd quantization-studio

# 用浏览器打开
# Windows
start index.html
# macOS
open index.html
# Linux
xdg-open index.html
```

### 本地开发

```bash
# 安装依赖（如果需要）
npm install

# 启动本地服务器
npx serve .
```

## 📖 使用说明

### 1. 选择模型

在模型仓库页面搜索或浏览模型，支持按任务类型、模型大小、框架筛选。

### 2. 配置量化参数

- **量化位宽**：2-16 位整数或浮点量化
- **量化方法**：GPTQ、AWQ、GGUF、INT8、FP8
- **目标 GPU**：根据您的硬件选择
- **上下文长度**：影响 KV Cache 显存占用

### 3. 查看分析结果

| 指标 | 说明 |
|------|------|
| 压缩率 | 量化后模型大小相比原始 FP16 的压缩比例 |
| 推理速度 | 预估的 token 生成速度 (tok/s) |
| 显存占用 | 模型加载所需的 GPU 显存 |
| 精度保持 | 预估的模型质量保持率 |
| 能效比 | 每瓦特功耗的推理效率 |

### 4. 导出配置

将量化配置导出为文本，方便在本地执行量化操作。

## 🛠️ 技术栈

- **前端**：原生 JavaScript、HTML5、CSS3
- **数据存储**：localStorage
- **模型仓库**：ModelScope API
- **计算引擎**：自定义量化参数计算引擎

## 📋 支持的量化方法

| 方法 | 位宽 | 速度影响 | 精度损失 | 适用场景 |
|------|------|---------|---------|---------|
| GPTQ | 4-8 | -5% | ~3% | 通用场景 |
| AWQ | 4-8 | 0% | ~2% | 高精度需求 |
| GGUF | 2-8 | -5% | ~2% | 本地部署 |
| INT8 | 8 | +10% | ~1% | 通用加速 |
| FP8 | 8 | +15% | ~1% | Hopper 架构 |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2025-01)
- 初始版本发布
- 基础量化计算功能
- ModelScope 模型仓库集成
- 多 GPU 支持

## 📄 许可证

本项目采用 MIT License 开源协议。

## 🙏 致谢

- [ModelScope](https://modelscope.cn/) - 模型仓库数据支持
- [Hugging Face](https://huggingface.co/) - 开源模型生态

---

⭐ 如果这个项目对您有帮助，欢迎给个 Star！
