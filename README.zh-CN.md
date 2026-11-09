[English](README.md) · **简体中文** · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md)

<a id="openmotion"></a>

# 🎬 OpenMotion

**Reverse engineering for any video**

<p align="center">
  <a href="https://github.com/nexu-io/html-anything"><img src="docs/readme/badges/stars.svg" alt="GitHub Stars · 9.5k（2026-11-09）"></a>
  <a href="package.json"><img src="docs/readme/badges/node.svg" alt="Node.js 22.18+"></a>
  <a href="LICENSE"><img src="docs/readme/badges/license.svg" alt="Apache 2.0 许可证"></a>
  <a href="https://github.com/nexu-io/open-design"><img src="docs/readme/badges/built-by-opendesign.svg" alt="Built by OpenDesign"></a>
</p>

<p align="center">
  <a href="https://open-design.ai/motion/?utm_source=github&amp;utm_medium=referral&amp;utm_campaign=openmotion&amp;utm_content=readme_zh"><img src="docs/readme/badges/website.zh-CN.svg" alt="OpenMotion 官网" /></a>
  <a href="https://go.open-design.ai/?utm_source=github&amp;utm_medium=referral&amp;utm_campaign=openmotion&amp;utm_content=readme_zh"><img src="docs/readme/badges/opendesign-go.svg" alt="OpenDesign Go 模型订阅" /></a>
  <a href="https://discord.gg/mHAjSMV6gz"><img src="docs/readme/badges/discord.svg" alt="加入 OpenDesign Discord" /></a>
  <a href="https://x.com/OpenDesignHQ"><img src="docs/readme/badges/x-opendesignhq.svg" alt="OpenDesign 官方 X 账号 @OpenDesignHQ" /></a>
  <a href="https://x.com/OpenDesignDevs"><img src="docs/readme/badges/x-opendesigndevs.svg" alt="OpenDesign 开发者 X 账号 @OpenDesignDevs" /></a>
  <a href="https://www.youtube.com/channel/UChtshixMhvtgBWzoD9R_Qfg"><img src="docs/readme/badges/youtube.svg" alt="OpenDesign 的 YouTube 频道" /></a>
</p>

OpenMotion 是 **首个全栈 Agentic 视频生成器**。上传参考视频，或粘贴社交平台上的视频链接。OpenMotion 逐镜拆解原片的节奏和转场，再**用你的画面、Logo 和文案复刻这段视频**。

- 🔑 **BYOA — Bring Your Own Agent. BYOK — Bring Your Own Keys.** OpenMotion 开源免费，每一层都能用自己的 API Key。已有 Codex、Claude Code、DeepSeek Harness 和 WorkBuddy [专用适配器](docs/README.zh-CN.md#agent-setup)，其他支持本地 stdio MCP 的客户端可[手动连接](docs/README.zh-CN.md#manual-mcp)。
- 🧩 OpenMotion 首次定义了 **Motion.md**，用 Markdown 记录镜头顺序、时长和转场。首批合集包含 **100 多份品牌宣传片 Motion.md**，另有 **890 多项创作资源**。
- 🎛️ **图片、视频、音乐和语音。** 用 Nano Banana 2 生成图片、Seedance 2.0 补镜头、Suno v4 配乐、Kokoro 加旁白，再放进同一条时间轴。[查看 7 个内置模型](docs/README.zh-CN.md#model-wall)

复刻结果是一份可编辑的 HTML 工程，可以在 Studio 里微调剪辑，再导出 MP4。

[完整中文 README](docs/README.zh-CN.md) · [21 个 Agent 的 Logo 墙](docs/README.zh-CN.md#agent-wall) · [使用场景与复刻效果示例](docs/README.zh-CN.md#showcase) · [为什么选择 OpenMotion](docs/README.zh-CN.md#features) · [安装与技术文档](docs/README.zh-CN.md#technical-guide) · [社区与贡献](docs/README.zh-CN.md#community)

## 致谢 / Acknowledgements

OpenMotion 使用 [Apache-2.0](LICENSE) 许可证。第三方代码、媒体与字体的来源和许可见[完整致谢](docs/README.zh-CN.md#acknowledgements)。
