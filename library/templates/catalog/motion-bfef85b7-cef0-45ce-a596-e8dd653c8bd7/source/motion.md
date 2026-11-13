# Grok｜财务分析

以青灰流体和暖色高光承托一组合作标识。文字稳定，背景负责维持画面的生命感。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Grok × PLAID",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#71a3a3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Grok × PLAID",
        "accent": "#71a3a3"
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

## 合作标识是唯一高对比层

双方标识用白色，保持共同基线和接近的视觉重量。中间分隔细而短，四周留出空白；青灰暗部压住背景，暖桃高光从侧后方通过。

## 缓慢改变光，而不改变布局

让高光沿流体表面移动，避免在标识背后形成刺眼边缘。流动周期可以长于整支片子，使开头和结尾都显得自然。

## 更换双方身份与底色

替换标识后先调整宽度和间距，再调整背景主色。合作关系用两方并列表达，整个画面维持一个信息层级。

## 配色与字形

青灰与暖桃流体、固定白色双品牌。

#435b58 · #ffffff · #71a3a3 · #e5baa3 · #162f33

## 元素与制作规则

主品牌 / 分隔线 / PLAID 名称 / 流体光影

- 双品牌静止，流体与光影变化构成唯一主体运动。
- 只用合作双方的身份表达连接关系，重点留给标识。

## 内容替换

- 用于合作公告，替换双方名称及色盘即可迁移。
- 保留留白和等权品牌关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V315",
  "palette": [
    "#435b58",
    "#ffffff",
    "#71a3a3",
    "#e5baa3",
    "#162f33"
  ],
  "typography": "青灰与暖桃流体、固定白色双品牌",
  "sample": "Grok × PLAID",
  "objects": [
    "主品牌",
    "分隔线",
    "PLAID 名称",
    "流体光影"
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
      "timeSeconds": 4.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "双品牌建立",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "流体位移",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "暖光穿过",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "保持品牌",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.0,
  "fontFamily": "Arial, sans-serif"
}
```
