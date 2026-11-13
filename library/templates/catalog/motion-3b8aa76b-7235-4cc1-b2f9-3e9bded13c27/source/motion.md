# Perplexity Computer — one agent for end-to-end projects

连续展示三种任务输出，最后用应用生态和成果墙收束。每次切换任务都要带来一种新的结果形态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 94.366667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 18,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Computer",
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
        "title": "Computer",
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

## 按输出类型安排案例

先展示复杂任务与报告，再用附件更新结果，接着展示视频和后续追问。每个案例保留输入与产物的配对，剪掉相同入口的重复操作。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 模式切换 |
| 7.00–18.00s | 复杂任务 |
| 18.00–26.00s | 综合报告 |
| 26.00–33.00s | 更新附件 |
| 33.00–41.00s | 可视化结果 |
| 41.00–49.00s | 第二任务 |
| 49.00–57.00s | 视频片段 |
| 57.00–66.00s | 第三任务 |
| 66.00–73.00s | 继续追问 |
| 73.00–81.00s | 应用生态 |
| 81.00–89.00s | 成果墙 |
| 89.00–94.37s | 品牌 |

## 让结果决定展示方式

报告用局部放大展示结构，图表用较宽画面保留坐标，视频用清楚的播放区域，后续追问留在同一任务上下文中。不要让不同产物套用同一张空白卡片。

![57.00s · 构图参考](assets/reference-4.jpg)

## 从单个成果扩展到成果墙

先让应用图标围绕中心主张展开，再用多列结果接住视觉密度。图标表示连接范围，成果列表示实际交付，两种信息按先后呈现。

```motion-demo
{
  "id": "clip-3",
  "title": "从单个成果扩展到成果墙",
  "src": "demos/clip-3.html",
  "duration": 16,
  "status": "authored",
  "description": "73–89 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 轻背景与统一标题形成系列感

使用浅暖底和青绿色强调，正文保持深色高对比。衬线主张页负责停顿，无衬线工具界面负责说明；各案例对齐同一视觉中心，避免每次任务切换都重新定位。

## 整组替换任务与产物

换品牌前先选三种确实不同的输出，例如文档、原型和演示视频。每种结果都配对应输入，成果墙沿用这些结果；图标生态也换成目标产品实际相关的工具。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

模式开关 / 任务框 / 文档产物 / 视频产物 / 应用图标 / 成果列

- 相同任务入口承载不同输出类型，连续案例展示能力广度。
- 应用图标围绕中心主张分布，随后成果纵列承接。

## 内容替换

- 换主题要替换整个任务与结果配对，不只品牌名。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V083",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Computer",
  "objects": [
    "模式开关",
    "任务框",
    "文档产物",
    "视频产物",
    "应用图标",
    "成果列"
  ],
  "frames": [
    {
      "path": "assets/reference-1.jpg",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 33.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 57.0,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 73.0,
      "frameId": "K0150",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 89.0,
      "frameId": "K0194",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "模式切换",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "复杂任务",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "综合报告",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "更新附件",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "可视化结果",
      "end": 41,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41,
      "label": "第二任务",
      "end": 49,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 49,
      "label": "视频片段",
      "end": 57,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 57,
      "label": "第三任务",
      "end": 66,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 66,
      "label": "继续追问",
      "end": 73,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 73,
      "label": "应用生态",
      "end": 81,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 81,
      "label": "成果墙",
      "end": 89,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 89,
      "label": "品牌",
      "end": 94.366667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 94.366667,
  "fontFamily": "Georgia, serif"
}
```
