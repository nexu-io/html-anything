# Zaro 产品发布

先从一条输入生成客户看板，再加入 agent、外部工具和文件问答。每次能力增加都回到同一工作对象，结尾拉远看多个应用的网络。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 68.533,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 24,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build an app.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#b5a1e5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build an app.",
        "accent": "#b5a1e5"
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

## 让一款应用逐渐长成系统

先从一条输入生成客户看板，再加入 agent、外部工具和文件问答。每次能力增加都回到同一工作对象，结尾拉远看多个应用的网络。

| 时间 | 段落 |
|---|---|
| 0.00–10.00s | 光标与开场短句 |
| 10.00–15.00s | 输入创建应用 |
| 15.00–20.00s | 应用结果 |
| 20.00–28.00s | 加入 agents |
| 28.00–34.00s | 简单到规模化 |
| 34.00–41.00s | 连接工具 |
| 41.00–58.00s | 文件与问答 |
| 58.00–66.00s | 应用扩为系统 |
| 66.00–68.53s | 品牌 |

## 用版面换色区分主张与操作

深灰褐页放短句，米白页放输入和真实界面。淡紫负责光标和强调词，其他标签颜色少量出现。字号大、行数少，避免长段口号。

## 复杂度增加时把镜头拉远

工具图标从周围聚来，文件变成列表；最后应用缩小进入环状网络。视野变大与对象增多同步，原来的应用仍应可辨。

```motion-demo
{
  "id": "clip-3",
  "title": "复杂度增加时把镜头拉远",
  "src": "demos/clip-3.html",
  "duration": 6,
  "status": "authored",
  "description": "59–65 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 迁移时保留同一个业务主角

更换业务应用、agent 职责和接入工具，保留“创建—自动运行—连接知识—扩为系统”的递进。

## 配色与字形

米白与灰褐大色面交替；中等无衬线配淡紫光标和彩色小标签。。

#edece5 · #251f1c · #b5a1e5 · #514743 · #bfc0ad

## 元素与制作规则

输入光标 / 应用看板 / agent 标签 / 工具图标环 / 文件列表 / 系统网络

- 先从一条输入生成客户看板，再加入 agent、外部工具和文件问答。每次能力增加都回到同一工作对象，结尾拉远看多个应用的网络。
- 深灰褐页放短句，米白页放输入和真实界面。淡紫负责光标和强调词，其他标签颜色少量出现。字号大、行数少，避免长段口号。
- 工具图标从周围聚来，文件变成列表；最后应用缩小进入环状网络。视野变大与对象增多同步，原来的应用仍应可辨。

## 内容替换

- 改成目标业务工作台，不把所有能力展示成互不相关的截图。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Zaro",
  "id": "V120",
  "palette": [
    "#edece5",
    "#251f1c",
    "#b5a1e5",
    "#514743",
    "#bfc0ad"
  ],
  "typography": "米白与灰褐大色面交替；中等无衬线配淡紫光标和彩色小标签。",
  "sample": "Build an app.",
  "objects": [
    "输入光标",
    "应用看板",
    "agent 标签",
    "工具图标环",
    "文件列表",
    "系统网络"
  ],
  "frames": [
    {
      "path": "assets/reference-1.webp",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 15.00001459143969,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 20.000019455252918,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 34.00003307392996,
      "frameId": "K0105",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 41.000039883268485,
      "frameId": "K0127",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 66.00006420233463,
      "frameId": "K0208",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "光标与开场短句",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "输入创建应用",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "应用结果",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "加入 agents",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "简单到规模化",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "连接工具",
      "end": 41,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41,
      "label": "文件与问答",
      "end": 58,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 58,
      "label": "应用扩为系统",
      "end": 66,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 66,
      "label": "品牌",
      "end": 68.533,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 68.533,
  "fontFamily": "Arial, sans-serif"
}
```
