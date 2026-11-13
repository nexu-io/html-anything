# Deep Research — now native inside Computer

让一个研究请求展开为并行工作，再收束为报告、结论和来源。节奏从操作进入整理，再进入阅读。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 62.7,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Deep Research",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2c8587"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Deep Research",
        "accent": "#2c8587"
      }
    },
    {
      "label": "OpenDesign 改编",
      "values": {
        "title": "OpenDesign",
        "accent": "#7050da"
      }
    }
  ]
}
```

## 研究入口要具体

先出现技能入口，再填写明确的研究任务。浅暖背景上使用深色文字和青绿选中态；主张页用衬线字，输入框、表格和来源列表用无衬线字。长问题拆成两至三行，避免把整段需求塞满屏幕。

![0.00s · 构图参考](https://r.open-design.ai/files/09daffb15b49084c393b0780225ac01319c838d5c65681e2c2326893c63f3b99)

## 子任务先展开，报告后出现

并行检索可以展示不同方向的工作状态；它们结束后才进入完成报告。处理阶段保持主界面位置，切到报告时用内容密度变化制造清楚的结果感。

```motion-demo
{
  "id": "clip-2",
  "title": "子任务先展开，报告后出现",
  "src": "demos/clip-2.html",
  "duration": 22,
  "status": "authored",
  "description": "11–33 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 先给表格，再给结论与来源

数据表交代比较依据，结论表负责提炼；来源另用一个短段落展示。每张表用局部近景保证列名可读，表格之间用简短标题分隔。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 技能入口 |
| 6.00–11.00s | 菜单选择 |
| 11.00–17.00s | 研究请求 |
| 17.00–22.00s | 标题 |
| 22.00–28.00s | 并行检索 |
| 28.00–33.00s | 报告完成 |
| 33.00–38.00s | 数据表 |
| 38.00–44.00s | 结论表 |
| 44.00–49.00s | 来源主张 |
| 49.00–55.00s | 成果列 |
| 55.00–62.70s | 品牌 |

## 成果列作为汇总，不再加新任务

尾段只排列前面已经建立的报告类型，保持文档比例、标题位置和间距一致。让成果列稳定后再落品牌，留出完成感。

## 迁移时先准备研究材料

替换领域时一起改问题、子任务方向、数据表、结论和引用名称。只保留能支撑最终结论的材料，避免装饰性的来源列表与正文无关。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

技能标签 / 研究请求 / 子任务 / 报告表格 / 来源 / 成果列

- 研究请求交给子任务，报告必须晚于检索；结论与来源分开展示。
- 复杂表格用局部近景，随后留出简短主张。

## 内容替换

- 换领域需替换研究问题、数据表和结论；不复用无关数字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V251",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Deep Research",
  "objects": [
    "技能标签",
    "研究请求",
    "子任务",
    "报告表格",
    "来源",
    "成果列"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/09daffb15b49084c393b0780225ac01319c838d5c65681e2c2326893c63f3b99",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 11.0,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 22.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 33.0,
      "frameId": "K0089",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 44.0,
      "frameId": "K0132",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 55.0,
      "frameId": "K0160",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "技能入口",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "菜单选择",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "研究请求",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "标题",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "并行检索",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "报告完成",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "数据表",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "结论表",
      "end": 44,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44,
      "label": "来源主张",
      "end": 49,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 49,
      "label": "成果列",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "品牌",
      "end": 62.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 62.7,
  "fontFamily": "Georgia, serif"
}
```
