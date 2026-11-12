# 适配 iPhone Duo

把屏幕展开当作布局变化，而不是切到另一项任务。设备形态变化，任务标题、结果与操作位置要能追得上。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 27.833333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Two screens. One agent.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Two screens. One agent.",
        "accent": "#538cbe"
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

## 窄屏里先建立内容锚点

开场保留一个清楚的任务和一个可辨认成果。展开时围绕设备中线增加宽度，让原有内容留在一侧，新空间用来容纳侧栏或第二面板。

边框用深色，内容区用浅色；字形沿用清晰界面字体。强调色服务于同一任务，折叠前后不要突然换一套色彩。

## 宽屏要展示新的空间价值

展开后依次展示游戏、预览、全屏媒体与可调整分栏，让额外空间对应不同使用方式。调整分栏时保持任务栏稳定，成果随可用区域重新排版。

避免只把窄屏内容横向拉伸。文字换行、侧栏出现与媒体尺寸应各自响应宽度变化。

```motion-demo
{
  "id": "clip-2",
  "title": "宽屏要展示新的空间价值",
  "src": "demos/clip-2.html",
  "duration": 8,
  "status": "authored",
  "description": "6–14 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 折回后还在做同一件事

收起内屏时，先保持任务结果，再把它接到外屏。外屏可以省略次要操作，但任务名、最新结果或继续入口必须留下。

更换设备或产品时，优先规划窄屏、宽屏、外屏三种内容关系，再设计边框与折叠外观。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

折叠设备 / 铰链 / 侧栏 / 成果视图 / 外屏

- 设备宽度变化时同一任务继续显示，不是切成新任务
- 宽屏承载分栏与多屏预览，外屏回到单列
- 真实手持镜头用于证明折叠动作，功能字幕先于或同步出现

## 内容替换

- 迁移保留形态改变→布局适配→上下文连续
- 可替换任务内容与设备外形，但不要把内外屏做成无关内容

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V050",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Two screens. One agent.",
  "objects": [
    "折叠设备",
    "铰链",
    "侧栏",
    "成果视图",
    "外屏"
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
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 14.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 23.0,
      "frameId": "K0082",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "窄屏设备",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "展开宽屏",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "游戏预览",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "多页面应用",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "全屏视频",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "调整侧栏",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "合上设备",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "外屏继续",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "品牌",
      "end": 27.833333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 27.833333,
  "fontFamily": "Arial, sans-serif"
}
```
