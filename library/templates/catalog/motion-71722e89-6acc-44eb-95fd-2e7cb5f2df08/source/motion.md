# QuiverAI Arrow 2｜矢量生成

让矢量生成的价值从路径可编辑性、作品类别和真实载体三个尺度展开，最后回到同风格的变体生成。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 43.84,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Arrow 2.0",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#8fbcca"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Arrow 2.0",
        "accent": "#8fbcca"
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

## 路径控制点把作品与编辑能力连起来

开场用贝塞尔曲线和锚点托住标题，随后在作品边缘出现选框。细青色线保持轻量，不要覆盖图案本身；白底与深色标题保证分类可读。

## 类别滚动带出不同作品

Illustrations、Icons、Technical Drawings 等词沿垂直轴切换，当前类别居中加深，邻近类别变浅。对应作品从两侧出现，类别与作品同时更新。

```motion-demo
{
  "id": "clip-2",
  "title": "类别滚动带出不同作品",
  "src": "demos/clip-2.html",
  "duration": 6,
  "status": "authored",
  "description": "8–14 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 同一个图案跨载体保持轮廓

轮廓路径先独立展示，再出现在鞋面、纸张与刺绣。紧接作品全景和风格变体操作，说明一份视觉资产如何扩展为系列。

| 时间 | 段落 |
|---|---|
| 0.00–2.60s | 控制曲线标题 |
| 2.60–4.00s | 发布文字 |
| 4.00–7.00s | 图标与应用 |
| 7.00–8.50s | 说明书 |
| 8.50–15.70s | 类别滚动 |
| 15.70–21.00s | 代码覆盖作品 |
| 21.00–23.50s | 轮廓路径 |
| 23.50–26.00s | 实物应用 |
| 26.00–30.00s | 作品全景 |
| 30.00–32.00s | 风格变体输入 |
| 32.00–34.00s | 变体结果 |
| 34.00–40.00s | 处理路径 |
| 40.00–43.00s | 结语 |
| 43.00–43.84s | 品牌 |

## 新主题要准备成组作品与对应载体

替换分类、作品、变体请求和实物展示时，至少有一件图案贯穿矢量与应用。主次层级沿路径—作品—载体逐步展开，避免无关图片轮播。

## 配色与字形

无衬线分类标题与小号等宽编辑标签；矢量控制点和极细路径线。

#f7f8f8 · #17232b · #8fbcca · #2a529c · #d8e2e5

## 元素与制作规则

矢量路径 / 控制点 / 类别滚轮 / 作品网格 / 代码浮层 / 实物载体 / 风格变体

- 让矢量生成的价值从路径可编辑性、作品类别和真实载体三个尺度展开，最后回到同风格的变体生成。
- 开场用贝塞尔曲线和锚点托住标题，随后在作品边缘出现选框。细青色线保持轻量，不要覆盖图案本身；白底与深色标题保证分类可读。
- Illustrations、Icons、Technical Drawings 等词沿垂直轴切换，当前类别居中加深，邻近类别变浅。对应作品从两侧出现，类别与作品同时更新。

## 内容替换

- 替换分类、作品、变体请求和实物展示时，至少有一件图案贯穿矢量与应用。主次层级沿路径—作品—载体逐步展开，避免无关图片轮播。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "QuiverAI",
  "id": "V383",
  "palette": [
    "#f7f8f8",
    "#17232b",
    "#8fbcca",
    "#2a529c",
    "#d8e2e5"
  ],
  "typography": "无衬线分类标题与小号等宽编辑标签；矢量控制点和极细路径线",
  "sample": "Arrow 2.0",
  "objects": [
    "矢量路径",
    "控制点",
    "类别滚轮",
    "作品网格",
    "代码浮层",
    "实物载体",
    "风格变体"
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
      "path": "https://r.open-design.ai/files/c4f7d1ac3aea1543f88551eb9b91815c151203b003eef0661ee2b0a9a1dac46a",
      "timeSeconds": 7.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 15.76,
      "frameId": "K0049",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0b117769f34748123b1619c66f2a7db2628d7b329900ff990fa856237047fbf6",
      "timeSeconds": 26.0,
      "frameId": "K0084",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 32.0,
      "frameId": "K0111",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 43.0,
      "frameId": "K0137",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "控制曲线标题",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "发布文字",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "图标与应用",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "说明书",
      "end": 8.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.5,
      "label": "类别滚动",
      "end": 15.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.7,
      "label": "代码覆盖作品",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "轮廓路径",
      "end": 23.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.5,
      "label": "实物应用",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "作品全景",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "风格变体输入",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "变体结果",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "处理路径",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "结语",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "品牌",
      "end": 43.84,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 43.84,
  "fontFamily": "Arial, sans-serif"
}
```
