# Parallel Decisions API

从一个业务问题出发，拆成可查询的事实，再把事实拼成可行动的表格。橙色只标记问题焦点和最终优先级。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 35.3,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 24,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Decisions API",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ee6c30"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Decisions API",
        "accent": "#ee6c30"
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

## 先给决策问题，再拆查询

浅灰网格与点状地图做背景，白色问题栏居中。问题被拆成公司规模、产品变化与关联信息，事实卡逐一出现并带来源区域。

```motion-demo
{
  "id": "clip-1",
  "title": "先给决策问题，再拆查询",
  "src": "demos/clip-1.html",
  "duration": 8,
  "status": "authored",
  "description": "3–11 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 答案不是几段散文，而是可比较的列

先给账户和负责人，再增加人数、近期事件与相关性列。每列从左向右补入，行的身份不变，最后通过优先级标记选出行动对象。

```motion-demo
{
  "id": "clip-2",
  "title": "答案不是几段散文，而是可比较的列",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "18–25 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结尾回到原来的业务问题

完整表格回到问题栏下方，说明查询如何支持选择。迁移时重写决策、维度与输出动作，不只替换公司名；来源与状态应与示例数据对应。

## 配色与字形

短问题居中无衬线；结果表格和来源标签采用紧凑小字。

#ecece7 · #171818 · #ee6c30 · #5d7f86 · #75977d

## 元素与制作规则

问题栏 / 点状地图 / 事实卡 / 来源标签 / 表格 / 优先级标 / 品牌

- 浅灰网格与点状地图做背景，白色问题栏居中。问题被拆成公司规模、产品变化与关联信息，事实卡逐一出现并带来源区域。
- 先给账户和负责人，再增加人数、近期事件与相关性列。每列从左向右补入，行的身份不变，最后通过优先级标记选出行动对象。
- 完整表格回到问题栏下方，说明查询如何支持选择。迁移时重写决策、维度与输出动作，不只替换公司名；来源与状态应与示例数据对应。

## 内容替换

- 替换决策问题、事实维度、来源和行动输出；保留问题到表格的闭环。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Parallel Web Systems",
  "id": "V198",
  "palette": [
    "#ecece7",
    "#171818",
    "#ee6c30",
    "#5d7f86",
    "#75977d"
  ],
  "typography": "短问题居中无衬线；结果表格和来源标签采用紧凑小字",
  "sample": "Decisions API",
  "objects": [
    "问题栏",
    "点状地图",
    "事实卡",
    "来源标签",
    "表格",
    "优先级标",
    "品牌"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/146f8ce750e22c8907c360fbca262b913e8fd7c25ae2014ddc5232260690110d",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/585d68026cf9b7febf7ff5f8f75847f3e05625abff80a440703a82b38272c22c",
      "timeSeconds": 6.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/7104c1bd729f3e7113db4b5a85a3274db6fbbc28e2f308baff2a2d5bce1c7906",
      "timeSeconds": 12.0,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/deeba629fcd0d9e2585ee0d3a89a00251c1e45b7533d57491fbf5e03d809e784",
      "timeSeconds": 15.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/83590ffe2c99551dcfb1559d3ac105e1fb51d59ffc724951ad8c4b626df7983a",
      "timeSeconds": 24.0,
      "frameId": "K0082",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/eb14b5a839b16ca10cc1a2e042ff92c3ab71fb351f590f4de60a0ca610313883",
      "timeSeconds": 30.0,
      "frameId": "K0104",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "业务问题",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "拆开问题",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "查找事实",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "更多关联事实",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "API 主张",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "决策表格",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "补齐维度",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "选择目标",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "回到问题",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "品牌与用例",
      "end": 35.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 35.3,
  "fontFamily": "Arial, sans-serif"
}
```
