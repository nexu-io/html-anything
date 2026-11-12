# The web wasn’t built for AI agents

网页堆叠代表输入复杂度，橙色模块把流程接向结构化内容。网页和代码用相邻或连续镜头对应，形成可读的输入输出关系。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 66.041667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 37,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "The web for AI agents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ee4b0a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "The web for AI agents",
        "accent": "#ee4b0a"
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

## 把网页到数据的转换画出来

网页堆叠代表输入复杂度，橙色模块把流程接向结构化内容。网页和代码用相邻或连续镜头对应，形成可读的输入输出关系。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 橙色模块 |
| 3.00–11.00s | 聊天与网页堆栈 |
| 11.00–16.00s | 成本与阻碍 |
| 16.00–22.00s | 模块转换 |
| 22.00–30.00s | 网页结构 |
| 30.00–35.00s | 交互与登录 |
| 35.00–42.00s | 网页矩阵 |
| 42.00–51.00s | 结构化数据 |
| 51.00–60.00s | 检索与结果 |
| 60.00–66.04s | 收束品牌 |

## 橙色只承担动作和关键对象

淡灰网格固定全片空间；橙色点、线、方块和面板连接不同界面，黑色卡片用于突出阻碍或信息密度。

## 矩阵里突出当前处理对象

大量网页形成网格时，让中央页面保持清楚，周围缩小或降低对比。数据整理阶段把杂乱信息变成规律的行和方块。

```motion-demo
{
  "id": "clip-3",
  "title": "矩阵里突出当前处理对象",
  "src": "demos/clip-3.html",
  "duration": 5,
  "status": "authored",
  "description": "35–40 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换内容仍保留转换关系

可以改为文档、表格或媒体处理。保留输入复杂、处理中间态、结果整齐三种不同状态，而不是只改宣传标题。

## 配色与字形

浅色网格、橙色几何模块、黑白网页与代码对照。。

#fafafa · #202020 · #ee4b0a · #d9d9d9 · #f0d0c4

## 元素与制作规则

网格 / 橙色方块 / 网页堆栈 / 代码 / 页面矩阵 / 结构数据 / 检索结果

- 网页堆叠代表输入复杂度，橙色模块把流程接向结构化内容。网页和代码用相邻或连续镜头对应，形成可读的输入输出关系。
- 淡灰网格固定全片空间；橙色点、线、方块和面板连接不同界面，黑色卡片用于突出阻碍或信息密度。
- 大量网页形成网格时，让中央页面保持清楚，周围缩小或降低对比。数据整理阶段把杂乱信息变成规律的行和方块。

## 内容替换

- 替换网页和数据样本，保持从复杂输入到规范输出的结构。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Firecrawl",
  "id": "V123",
  "palette": [
    "#fafafa",
    "#202020",
    "#ee4b0a",
    "#d9d9d9",
    "#f0d0c4"
  ],
  "typography": "浅色网格、橙色几何模块、黑白网页与代码对照。",
  "sample": "The web for AI agents",
  "objects": [
    "网格",
    "橙色方块",
    "网页堆栈",
    "代码",
    "页面矩阵",
    "结构数据",
    "检索结果"
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
      "timeSeconds": 11.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0073",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 30.0,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 42.0,
      "frameId": "K0142",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 60.0,
      "frameId": "K0196",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "橙色模块",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "聊天与网页堆栈",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "成本与阻碍",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "模块转换",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "网页结构",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "交互与登录",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "网页矩阵",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "结构化数据",
      "end": 51,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 51,
      "label": "检索与结果",
      "end": 60,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 60,
      "label": "收束品牌",
      "end": 66.041667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 66.041667,
  "fontFamily": "Arial, sans-serif"
}
```
