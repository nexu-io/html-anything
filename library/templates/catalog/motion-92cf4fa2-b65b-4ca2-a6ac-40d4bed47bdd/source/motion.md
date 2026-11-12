# 活动上线｜Config Makeathon

先用图案和字形建立活动视觉印象，再用奖金与作品回答“为什么参与、能做出什么”，最后给出上线状态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.933333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "MAKEATHON",
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
        "title": "MAKEATHON",
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

## 开场快，活动名稳

图案快切可以高密度，但活动名出现时暂时减速。字形动画围绕同一个名称展开，完整标题至少稳定一次，避免观众只看到运动而记不住活动。

```motion-demo
{
  "id": "clip-1",
  "title": "开场快，活动名稳",
  "src": "demos/clip-1.html",
  "duration": 9,
  "status": "authored",
  "description": "0–9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 奖金停顿之后展示作品

奖金作为独立信息屏，数字和单位保持完整。作品段允许快切，但每个画面应有清楚主体；上线提示比作品段慢，合作品牌最后进入。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 图案快切 |
| 3.00–5.00s | 字形动画 |
| 5.00–7.00s | 活动名 |
| 7.00–9.00s | 奖金 |
| 9.00–19.00s | 作品集 |
| 19.00–22.00s | 上线提示 |
| 22.00–24.93s | 合作品牌 |

## 让作品色彩组成整场活动

以深色舞台、浅色无衬线标题为底，绿、紫、橙图案形成活动视觉。图案块可以裁切，活动名和奖金不可裁切；作品与品牌落版沿用同一边距体系。

## 迁移成另一场创作活动

替换活动名、奖金、作品、上线文案和合作标志。选择能代表参与产物的作品，而非无关炫技画面；若无奖金，可改成明确的参与收益，并保留同样的阅读停顿。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

图案模块 / 活动字形 / 奖金数字 / 作品画面 / 品牌

- 开头图案与字形建立活动识别，中段作品快速证明参与产物，末尾说明已上线。
- 奖金是独立阅读停顿，不能被快切覆盖。

## 内容替换

- 可换创作赛事；必须替换作品示例与活动数字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V106",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "MAKEATHON",
  "objects": [
    "图案模块",
    "活动字形",
    "奖金数字",
    "作品画面",
    "品牌"
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
      "timeSeconds": 3.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.0,
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/2c55e8fd97f354268a990a91065e79602e8ba130d9bec8f352ca6e591ccd1ab0",
      "timeSeconds": 9.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0110",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "图案快切",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "字形动画",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "活动名",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "奖金",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "作品集",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "上线提示",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "合作品牌",
      "end": 24.933333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.933333,
  "fontFamily": "Arial, sans-serif"
}
```
