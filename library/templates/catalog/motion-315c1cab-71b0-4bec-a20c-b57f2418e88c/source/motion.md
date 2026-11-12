# 网站、deck、发布图讲同一个故事

输入创建咖啡网站后，继续要求演示稿和发布图。三类成果共享照片、褐色色盘与衬线标题，用内容一致性说明上下文复用。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "One conversation. Many outcomes.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e52a0a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "One conversation. Many outcomes.",
        "accent": "#e52a0a"
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

## 同一品牌从网站走到发布素材

输入创建咖啡网站后，继续要求演示稿和发布图。三类成果共享照片、褐色色盘与衬线标题，用内容一致性说明上下文复用。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 人物与请求 |
| 2.00–3.80s | 品牌网站 |
| 3.80–5.80s | 继续生成 deck |
| 5.80–7.20s | 演示稿展开 |
| 7.20–8.80s | 生成发布图 |
| 8.80–10.50s | 三张竖版广告 |
| 10.50–12.80s | 连续任务清单 |
| 12.80–15.00s | 回到人物 |

## 每次生成都保留上一步的视觉线索

网站先居中，再扇开多页 deck；下一次输入在已有成果之间出现，最后排成三张竖版海报。不要每段都彻底清空画面。

```motion-demo
{
  "id": "clip-2",
  "title": "每次生成都保留上一步的视觉线索",
  "src": "demos/clip-2.html",
  "duration": 4.1000000000000005,
  "status": "authored",
  "description": "5.7–9.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 轻页面承托较重的品牌素材

外层米白留白充足，输入卡用细阴影，橙红平台标记固定在右上。结束时回到人物照片，配一条短结论即可。

## 配色与字形

温暖米白背景，咖啡品牌使用褐色摄影与衬线字，平台标记橙红。。

#faf7f0 · #24211e · #e52a0a · #a48e79 · #d7c8b8

## 元素与制作规则

人物照片 / 输入卡 / 网站 / 演示稿 / 竖版广告 / 任务清单

- 输入创建咖啡网站后，继续要求演示稿和发布图。三类成果共享照片、褐色色盘与衬线标题，用内容一致性说明上下文复用。
- 网站先居中，再扇开多页 deck；下一次输入在已有成果之间出现，最后排成三张竖版海报。不要每段都彻底清空画面。
- 外层米白留白充足，输入卡用细阴影，橙红平台标记固定在右上。结束时回到人物照片，配一条短结论即可。

## 内容替换

- 换一套品牌资产，同时替换网站、deck 与广告；保留同一对话持续产出的顺序。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Replit",
  "id": "V144",
  "palette": [
    "#faf7f0",
    "#24211e",
    "#e52a0a",
    "#a48e79",
    "#d7c8b8"
  ],
  "typography": "温暖米白背景，咖啡品牌使用褐色摄影与衬线字，平台标记橙红。",
  "sample": "One conversation. Many outcomes.",
  "objects": [
    "人物照片",
    "输入卡",
    "网站",
    "演示稿",
    "竖版广告",
    "任务清单"
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
      "timeSeconds": 2.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.875,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 7.25,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 10.5,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 12.791666666666666,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "人物与请求",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "品牌网站",
      "end": 3.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.8,
      "label": "继续生成 deck",
      "end": 5.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.8,
      "label": "演示稿展开",
      "end": 7.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.2,
      "label": "生成发布图",
      "end": 8.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.8,
      "label": "三张竖版广告",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "连续任务清单",
      "end": 12.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.8,
      "label": "回到人物",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.0,
  "fontFamily": "Georgia, serif"
}
```
