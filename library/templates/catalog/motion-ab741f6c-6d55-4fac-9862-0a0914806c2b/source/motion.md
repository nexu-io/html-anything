# Framer Agent Templates

三张模板横排，中央卡完整显示，两侧只露一部分并压暗。切换时整条轨道横向滑动，到位后才恢复中央卡的亮度。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.5,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agent Templates",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2137f0"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Agent Templates",
        "accent": "#2137f0"
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

## 始终给中央模板最高亮度

三张模板横排，中央卡完整显示，两侧只露一部分并压暗。切换时整条轨道横向滑动，到位后才恢复中央卡的亮度。

```motion-demo
{
  "id": "clip-1",
  "title": "始终给中央模板最高亮度",
  "src": "demos/clip-1.html",
  "duration": 0.8500000000000001,
  "status": "authored",
  "description": "1.15–2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 边框统一，内容允许有个性

卡片使用同一圆角和相同尺寸，内部保留蓝白大字、黑底作品集和衬线白页三种风格。名称与徽标固定在相同基线上。

## 增加模板时延长轨道

替换缩略图、名称和作者即可；每张留读时间应明显长于滑动时间，首尾排列能自然回到第一张。

## 配色与字形

黑色画廊底；卡片各有独立字体，名称与 Agent 标签在卡片下方。。

#000000 · #ffffff · #2137f0 · #d9d9d4 · #858585

## 元素与制作规则

中央模板缩略图 / 左右预览卡 / 模板名称 / Agent 徽标

- 三张模板横排，中央卡完整显示，两侧只露一部分并压暗。切换时整条轨道横向滑动，到位后才恢复中央卡的亮度。
- 卡片使用同一圆角和相同尺寸，内部保留蓝白大字、黑底作品集和衬线白页三种风格。名称与徽标固定在相同基线上。
- 替换缩略图、名称和作者即可；每张留读时间应明显长于滑动时间，首尾排列能自然回到第一张。

## 内容替换

- 更换三张网页作品，保持尺寸、中央聚焦和循环节奏。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V280",
  "palette": [
    "#000000",
    "#ffffff",
    "#2137f0",
    "#d9d9d4",
    "#858585"
  ],
  "typography": "黑色画廊底；卡片各有独立字体，名称与 Agent 标签在卡片下方。",
  "sample": "Agent Templates",
  "objects": [
    "中央模板缩略图",
    "左右预览卡",
    "模板名称",
    "Agent 徽标"
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
      "timeSeconds": 1.25,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.35,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 5.466666666666667,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "蓝色模板居中",
      "end": 1.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.3,
      "label": "横移到黑色模板",
      "end": 3.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.4,
      "label": "横移到白色模板",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "循环回蓝色模板",
      "end": 6.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.5,
  "fontFamily": "Arial, sans-serif"
}
```
