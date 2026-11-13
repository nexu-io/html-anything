# 模型发布｜GPT-6 Sol / Luna

用连续推进把星场、太阳、月牙和产品名连成一次飞行，靠尺度与冷暖变化组织节奏。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 16.2,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "GPT-6 Luna",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e8b85b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "GPT-6 Luna",
        "accent": "#e8b85b"
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

## 让观众始终知道前进方向

深色背景中的星点围绕中心组织，推进时向外拉伸。太阳用暖金，月牙用冷蓝；字幕使用白色无衬线，前半段留给天体。

## 大天体掠过，接管下一镜

先朝亮点推进，太阳放大并从边缘掠过；月牙随后成为新的中心。利用天体遮住画面的时刻连接下一段，持续同一运动方向。

月牙离开后产品名从小到大，承接推进惯性，尾段可以让大字超出画幅。

## 替换成一对有对照的符号

可用两种材质、两个产品状态或两枚互补图形替换日月。保持暖冷、明暗或轻重的对照，最后只留下一个短产品名。

## 配色与字形

深空星点、暖太阳与冷月牙、白色无衬线标题。

#080e13 · #ffffff · #e8b85b · #a5b9ee · #24434e

## 元素与制作规则

星点场 / 螺旋构图 / 太阳 / 月牙 / 产品标题

- 推进先由星点径向拉伸建立速度，再让太阳与月牙依次接管中心。
- 大天体从边缘掠过，作为遮挡转场；不是两个圆简单淡入。
- 标题从小到大承接最后推进，尾帧可超出画面。

## 内容替换

- 可换一对含义互补的视觉符号，保留暖冷对照与连续推进。
- 产品名在最后读点出现，前段少文字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V010",
  "palette": [
    "#080e13",
    "#ffffff",
    "#e8b85b",
    "#a5b9ee",
    "#24434e"
  ],
  "typography": "深空星点、暖太阳与冷月牙、白色无衬线标题",
  "sample": "GPT-6 Luna",
  "objects": [
    "星点场",
    "螺旋构图",
    "太阳",
    "月牙",
    "产品标题"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 4.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 8.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 11.533333333333333,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 13.0,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "星空建立",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "螺旋星团",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "向亮点推进",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "太阳掠过",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "月牙成为中心",
      "end": 11.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.5,
      "label": "月牙掠过揭标题",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "产品名放大",
      "end": 16.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 16.2,
  "fontFamily": "Arial, sans-serif"
}
```
