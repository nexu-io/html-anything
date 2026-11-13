# 研究界面开孔

大椭圆由多个灰紫灰绿块面组成，任务卡靠近中心黑点。整体逐渐缩小，外侧出现白色圆洞，黑点保持在画面中心。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.375,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Research in context",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9b92aa"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Research in context",
        "accent": "#9b92aa"
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

## 缩小信息场，保留中心锚点

大椭圆由多个灰紫灰绿块面组成，任务卡靠近中心黑点。整体逐渐缩小，外侧出现白色圆洞，黑点保持在画面中心。

```motion-demo
{
  "id": "clip-1",
  "title": "缩小信息场，保留中心锚点",
  "src": "demos/clip-1.html",
  "duration": 3.6,
  "status": "authored",
  "description": "0–3.6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 由空间拼贴转成资源关系

椭圆收起后留下方孔，资源列表从旁边进入并以细线关联。周边几何降低密度，为卡片的文字留出白区。

## 更换任务时同步更新卡片关系

替换文档、资源数量和任务短句，保留从较大信息场收成核心，再展开上下文的过程。

## 配色与字形

纸面低饱和拼贴，中央黑点、白卡和细线维持信息秩序。。

#f1f1ed · #25242c · #9b92aa · #b4c4bc · #c9b7b9 · #387b69

## 元素与制作规则

椭圆分区 / 中心黑点 / 白色任务卡 / 方孔 / 资源列表 / 周边几何

- 大椭圆由多个灰紫灰绿块面组成，任务卡靠近中心黑点。整体逐渐缩小，外侧出现白色圆洞，黑点保持在画面中心。
- 椭圆收起后留下方孔，资源列表从旁边进入并以细线关联。周边几何降低密度，为卡片的文字留出白区。
- 替换文档、资源数量和任务短句，保留从较大信息场收成核心，再展开上下文的过程。

## 内容替换

- 可用于研究、知识或文件聚合，中心对象和关联卡需语义一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Harvey",
  "id": "V336",
  "palette": [
    "#f1f1ed",
    "#25242c",
    "#9b92aa",
    "#b4c4bc",
    "#c9b7b9",
    "#387b69"
  ],
  "typography": "纸面低饱和拼贴，中央黑点、白卡和细线维持信息秩序。",
  "sample": "Research in context",
  "objects": [
    "椭圆分区",
    "中心黑点",
    "白色任务卡",
    "方孔",
    "资源列表",
    "周边几何"
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
      "timeSeconds": 1.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 2.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 3.25,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 4.5,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "横向椭圆信息场",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "卡片出现",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "椭圆缩小",
      "end": 3.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.2,
      "label": "圆洞收束",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "方孔与周边几何",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "资源卡重新展开",
      "end": 6.375,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.375,
  "fontFamily": "Arial, sans-serif"
}
```
