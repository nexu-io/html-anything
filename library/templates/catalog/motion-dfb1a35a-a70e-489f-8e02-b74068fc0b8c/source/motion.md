# Figma Draw

从作品的吸引力进入编辑细节，再回到完整海报。每次功能演示都要让作品发生可见变化。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 53.041667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Draw inspiration",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#96d93c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Draw inspiration",
        "accent": "#96d93c"
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

## 先给作品，再露出编辑手段

图形与创作主张开场，接路径文字、效果和纹理等局部操作。每次先保留一个清楚的初始状态，再操作参数，最后给变化结果，避免功能面板一闪而过。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 图形入口 |
| 5.00–9.00s | 创作主张 |
| 9.00–14.00s | 插画界面 |
| 14.00–19.00s | 沿路径文字 |
| 19.00–24.00s | 文字效果 |
| 24.00–28.00s | 纹理文字 |
| 28.00–32.00s | 图案 |
| 32.00–37.00s | 蝴蝶矢量 |
| 37.00–42.00s | 渐变编辑 |
| 42.00–46.00s | 海报落版 |
| 46.00–50.00s | 素材聚合 |
| 50.00–53.04s | 品牌 |

## 围绕同一个主图连续编辑

蝴蝶矢量、控制点、渐变填充和海报共享同一轮廓。选择轮廓时控制点沿边界出现，改变渐变时轮廓稳定；完成后将它带入海报，让局部操作有完整作品作为落点。

```motion-demo
{
  "id": "clip-2",
  "title": "围绕同一个主图连续编辑",
  "src": "demos/clip-2.html",
  "duration": 14,
  "status": "authored",
  "description": "32–46 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 高彩作品，低干扰的工具界面

用深灰舞台承接绿、紫、橙的创作素材，工具窗口保持浅色和细边框。标题采用中粗无衬线，面板参数用清楚的小号字；作品占主面积，控制点和面板只在操作时突出。

## 替换插画时保留编辑链

主图可以换成花卉、标志或抽象图形。先确定它能承受哪些路径、填充和纹理变化，再制作对应海报；功能演示和最终作品使用同一份图形身份。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

矢量轮廓 / 控制点 / 路径文字 / 效果面板 / 海报

- 先呈现作品，再展示控制点和参数如何改变作品；功能必须有视觉前后差异。
- 蝴蝶轮廓、渐变填充和最终海报共享同一图形身份。

## 内容替换

- 可换主插画和字体，但保留编辑操作→可见变化→作品落版。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V099",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Draw inspiration",
  "objects": [
    "矢量轮廓",
    "控制点",
    "路径文字",
    "效果面板",
    "海报"
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
      "timeSeconds": 9.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 32.0,
      "frameId": "K0126",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 42.0,
      "frameId": "K0164",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 50.0,
      "frameId": "K0198",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "图形入口",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "创作主张",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "插画界面",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "沿路径文字",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "文字效果",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "纹理文字",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "图案",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "蝴蝶矢量",
      "end": 37,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37,
      "label": "渐变编辑",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "海报落版",
      "end": 46,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46,
      "label": "素材聚合",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "品牌",
      "end": 53.041667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 53.041667,
  "fontFamily": "Arial, sans-serif"
}
```
