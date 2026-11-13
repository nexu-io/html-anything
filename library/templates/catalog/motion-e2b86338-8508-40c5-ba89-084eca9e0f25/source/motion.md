# Cursor 能操控电脑

用同屏关系说明谁在控制、谁在响应。左侧代理接收任务，右侧手机模拟器完成一组可追踪的操作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 21.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Control your apps",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9966cc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Control your apps",
        "accent": "#9966cc"
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

## 先输入一个具体目标

功能主张之后输入电脑操作请求，代理开始执行，再出现手机模拟器。指令应指向可在短片里完成的任务，例如查看内容并收藏。

代理栏用深色，模拟器内容使用浅色，暖色背景连接两者。任务文本保持清晰无衬线字，应用内部标题沿用其自己的层级。

## 把操作连成一条路径

列表滚动、打开详情、返回、收藏、进入收藏页依次发生。每次进入新页面，保留相同对象的名称或图片，让观众能认出仍是刚才那一项。

指针或触点先到达目标，随后才改变界面。代理日志只突出当前动作，不与手机同时滚动大段文字。

```motion-demo
{
  "id": "clip-2",
  "title": "把操作连成一条路径",
  "src": "demos/clip-2.html",
  "duration": 9,
  "status": "authored",
  "description": "9–18 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用结果状态收尾

最后推近收藏结果或完成状态，代理面板退为背景。

迁移到另一应用时，替换任务、列表、详情和最终结果；控制端与被控端的角色不变，避免把两边做成毫无关联的动画。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

指令框 / 代理日志 / 手机模拟器 / 路线列表 / 详情页 / 收藏状态 / 指针

- 左侧代理与右侧模拟器同屏，操作结果发生在受控应用中
- 滚动→详情→返回→收藏筛选是连贯操作，不是几张无关画面
- 末段推近收藏结果，反馈要与前面收藏操作对应

## 内容替换

- 换应用时保留代理端与被控端两种角色
- 列表内容可换，用户动作和最后结果的因果不能省略

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V071",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Control your apps",
  "objects": [
    "指令框",
    "代理日志",
    "手机模拟器",
    "路线列表",
    "详情页",
    "收藏状态",
    "指针"
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
      "timeSeconds": 7.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 13.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 15.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 19.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "功能主张",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "输入电脑操作请求",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "代理运行",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "出现手机模拟器",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "滚动路线",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "进入详情",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "返回列表",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "收藏筛选",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "品牌",
      "end": 21.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 21.033333,
  "fontFamily": "Arial, sans-serif"
}
```
