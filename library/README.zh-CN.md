[English](README.md) · **简体中文** · [OpenMotion](../docs/README.zh-CN.md)

# OpenMotion 资源库

**分享视频背后的方法、动效和品牌。** 从第一天就用这个目录收纳可复用的 Skills、模板、Motion 组件、动效设计体系和 Brandkit。可以贡献完整作品，也可以贡献一个讲清楚用途的小方法。

| 分类 | 从这里开始 | 收录内容 |
| --- | --- | --- |
| **🧠 Skills** | [Presenter Story](skills/presenter-story/SKILL.md) · [Motion Design Remix](skills/motion-design-remix/SKILL.md) · [Brandkit 整理](skills/brandkit/SKILL.md) | 用 `SKILL.md` 描述可重复使用的方法，按需附示例与参考。 |
| **🎞️ 模板** | [Studio 可编辑起点](templates/README.md) · [Presenter Tech](templates/presenter-tech/README.md) | 完整工程、预览、替换与改编说明。 |
| **🧩 Motion 组件** | [标题揭示配方](components/title-reveal/README.md) | 标题、转场、图表或场景，说明时序、可修改项与接入方式。 |
| **🎨 动效设计体系** | [Ink & Water](design-systems/ink-water/MOTION_DESIGN.md) | 用 `MOTION_DESIGN.md` 记录字体、构图、节奏、运动和声音规则。 |
| **💼 Brandkits** | [OpenMotion](brandkits/openmotion/BRANDKIT.md) | 品牌事实、可用文案、配色、字体、素材入口与使用规则。 |

```text
library/
├── skills/presenter-story/              → three presenter / motion recipes
├── skills/motion-design-remix/           → six source / remix profiles
├── skills/brandkit/SKILL.md
├── templates/presenter-tech/            → local presenter / motion package
├── templates/README.md                  → 现有可编辑工程源码
├── components/title-reveal/README.md     → 动效配方
├── design-systems/ink-water/MOTION_DESIGN.md
├── brandkits/openmotion/BRANDKIT.md
└── ENTRY_TEMPLATE.md                    → 贡献清单
```

## 🎞️ 把参考变成可传播的 Skill 包

[真人口播案例](../docs/motion-design-examples.zh-CN.md#presenter-motion)用三份设计配方连接真实语音、字幕、屏幕录制与动效；配套对比为上游演示，新的 OpenMotion 改编仍需制作与审片。

[六组动态对比](../docs/motion-design-examples.zh-CN.md)展示同一套动效实现怎样换成不同内容。每种 profile 都有 `MOTION_DESIGN.md`、保持/替换约定、固定版本源码、preset 与真实渲染证据。把可复用方法连同工程一起贡献，让下一位创作者可以继续改编。

<a id="使用资源"></a>

## 🚀 使用资源

1. 根据任务选择方法、设计体系或模板，先看状态和来源说明。
2. 将文件、自己的素材和修改目标明确交给 Agent。Brandkit 定义品牌身份，动效设计体系定义表现方式，模板提供可编辑实现。
3. 制作视频时继续使用[对应的制作 Skill](../docs/skills.md)，在同一工程里预览、修改和导出。

可选 Library Skills 可以从本地仓库分别安装：

```sh
npx skills add ./library/skills --skill brandkit
npx skills add ./library/skills --skill motion-design-remix
npx skills add ./library/skills --skill presenter-story
```

资源库当前是可浏览的源码目录，不会自动导入 Studio 或注册为 MCP 资源。五个核心制作入口仍在 [`skills/`](../skills/)；可选 Library Skills 提供品牌上下文、真人叙事设计配方或特定源码改编方法，不增加核心制作路线。[Studio 目录](../docs/template-catalog.md)与[可观看参考](../docs/collections/README.zh-CN.md)继续使用原有来源和行为。

<a id="贡献一个有用的起点"></a>

## 🤝 贡献一个有用的起点

在对应分类下新建文件夹，按[条目清单](ENTRY_TEMPLATE.md)写清用途、可编辑输入、示例、署名、许可和实际检查结果。已有模板通过链接复用，不维护第二份副本。

- **参考：** 附原作、作者与来源，供学习。
- **配方 / 草案：** 可阅读的指导，仍需在具体工程里验证。
- **可编辑示例：** 提供源码，并注明已检查的修改与导出。

记录工程版本、实际改编、导出与审片证据后，才称为已验证模板；封面、安装成功均不替代成片验证。PR 流程见[贡献指南](../CONTRIBUTING.zh-CN.md)。原创文字与示例遵循 [Apache-2.0](../LICENSE)，外部媒体和上游项目保留原许可与署名。
