# Resend Inboxes

把一个安静的深色收件箱推到前景，再用巨大标题与背光完成发布揭示。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.566667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "INBOXES",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#126dff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "INBOXES",
        "accent": "#126dff"
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

## 窗口扩大但保留列表秩序

收件箱从远处进入并占据下半画面，侧栏、邮件行和右上操作保持同一坐标关系。镜头的推进先于标题，让功能界面先建立存在感。

```motion-demo
{
  "id": "clip-1",
  "title": "窗口扩大但保留列表秩序",
  "src": "demos/clip-1.html",
  "duration": 4.5,
  "status": "authored",
  "description": "1–5.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 标题从窗口背后升起

标题位于窗口之后、光晕之前，出现后稳定在上半区。黑底与蓝青背光衬托白色窄体大写字，界面小字仅承担质感，不与发布名称争抢。

## 换名称和列表，保留层次

可改成其他列表型产品发布。替换主标题、邮件或任务内容、侧栏与按钮；保持“大标题在后、产品窗口在前、光晕在底”的三层关系。

## 配色与字形

无衬线窄体大写标题；小号界面文字，强烈大小对比。

#020404 · #ffffff · #126dff · #1c8b9b · #161a1d

## 元素与制作规则

收件箱窗口 / 巨型标题 / 蓝青光晕 / 邮件行

- 把一个安静的深色收件箱推到前景，再用巨大标题与背光完成发布揭示。
- 收件箱从远处进入并占据下半画面，侧栏、邮件行和右上操作保持同一坐标关系。镜头的推进先于标题，让功能界面先建立存在感。
- 标题位于窗口之后、光晕之前，出现后稳定在上半区。黑底与蓝青背光衬托白色窄体大写字，界面小字仅承担质感，不与发布名称争抢。

## 内容替换

- 可改成其他列表型产品发布。替换主标题、邮件或任务内容、侧栏与按钮；保持“大标题在后、产品窗口在前、光晕在底”的三层关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Resend",
  "id": "V204",
  "palette": [
    "#020404",
    "#ffffff",
    "#126dff",
    "#1c8b9b",
    "#161a1d"
  ],
  "typography": "无衬线窄体大写标题；小号界面文字，强烈大小对比",
  "sample": "INBOXES",
  "objects": [
    "收件箱窗口",
    "巨型标题",
    "蓝青光晕",
    "邮件行"
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
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 2.533333333333333,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 5.5,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 7.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黑场",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "小界面",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "窗口前移",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "蓝光升起",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "标题揭示",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "标题定格",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "光带循环",
      "end": 11.566667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.566667,
  "fontFamily": "Arial, sans-serif"
}
```
