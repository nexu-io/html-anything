# ElevenLabs — $500M raise at an $11B valuation

用融资背景引出产品版图，再逐条展示创作、代理与研究能力。数字是入口，产品使用才是中段的主体。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 57.34,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 15.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "ElevenLabs",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d9763b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "ElevenLabs",
        "accent": "#d9763b"
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

## 融资数字与背书成组出现

金额、估值和轮次各有自己的标签，投资者标记随后进入。大数字采用简洁无衬线粗体，限定文字保持清楚，不把不同口径的数值并列成竞争关系。

橙蓝流体或柔光承担背景，文字区尽量平静；进入工具界面后减少背景运动。

## 三个业务方向，各给一个具体画面

先用 Creative、Agents、API 等分栏建立产品地图，再进入编辑器、对话代理或接口场景。每一方向保留自己的标题和色彩线索，切换后仍能知道属于哪条线。

## 从整套编辑器抽出可控制的部分

创作段先给完整时间线，再让声音、视频和其他轨道局部浮出。片段与轨道保持时间关系，随后回到最终作品，说明这些控制在服务什么。

```motion-demo
{
  "id": "clip-3",
  "title": "从整套编辑器抽出可控制的部分",
  "src": "demos/clip-3.html",
  "duration": 9,
  "status": "authored",
  "description": "23–32 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从产品走向覆盖范围

多语言、全球分布和合作方依次扩大叙事尺度。语言标记对应内容能力，地图或地球表达范围，最后回到品牌使命。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 融资数字 |
| 7.00–14.00s | 投资者 |
| 14.00–18.00s | 产品矩阵 |
| 18.00–23.00s | 三个业务方向 |
| 23.00–28.00s | 创作编辑器 |
| 28.00–32.00s | 时间线图层 |
| 32.00–38.00s | 对话代理 |
| 38.00–44.00s | 语音研究 |
| 44.00–48.00s | 多语言 |
| 48.00–51.00s | 全球覆盖 |
| 51.00–54.00s | 合作方 |
| 54.00–57.34s | 使命与品牌 |

## 迁移时分开重写背景与能力

新的融资或增长信息使用自己的口径，产品段选实际存在的能力及界面。可以沿用从公司背景到产品再到影响范围的顺序，但每个方向都需要自己的具体例子。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f6f0 · #161616 · #d9763b · #7fb7ae · #d9d6c9

## 元素与制作规则

大数字 / 投资者标记 / 能力卡 / 业务分栏 / 时间线 / 对话 / 语言标记 / 地球点阵

- 数字与背书建立背景后进入实际产品，三条业务线分别配自己的视觉系统
- 时间线组件从完整编辑器抽离，再回到结果说明控制粒度
- 末尾语言和地球从局部扩展到全球覆盖

## 内容替换

- 保留背景→产品方向→具体证据→影响范围结构
- 融资数字、合作方与覆盖范围需随主题重新核实

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "ElevenLabs",
  "id": "V296",
  "palette": [
    "#f7f6f0",
    "#161616",
    "#d9763b",
    "#7fb7ae",
    "#d9d6c9"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "ElevenLabs",
  "objects": [
    "大数字",
    "投资者标记",
    "能力卡",
    "业务分栏",
    "时间线",
    "对话",
    "语言标记",
    "地球点阵"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/e86d819219540fb0f4c2bf9631ad0282b5d5244ab37c259be2f2fb15eb297622",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 13.995118549511854,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/76393ca158f48a7e2318b450b87fc566ed47f6370436b4d296ba1a60177814d3",
      "timeSeconds": 22.991980474198048,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 37.98675034867503,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 47.98326359832636,
      "frameId": "K0133",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 53.98117154811715,
      "frameId": "K0144",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "融资数字",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "投资者",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "产品矩阵",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "三个业务方向",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "创作编辑器",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "时间线图层",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "对话代理",
      "end": 38.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38.0,
      "label": "语音研究",
      "end": 44.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44.0,
      "label": "多语言",
      "end": 48.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48.0,
      "label": "全球覆盖",
      "end": 51.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 51.0,
      "label": "合作方",
      "end": 54.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54.0,
      "label": "使命与品牌",
      "end": 57.34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 57.34,
  "fontFamily": "Arial, sans-serif"
}
```
