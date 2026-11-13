# Grok × Coinbase

用深青蓝的慢速流动衬托固定双品牌，保留安静、稳定的合作公告气质。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 20.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Grok × coinbase",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#53879d"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Grok × coinbase",
        "accent": "#53879d"
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

## 先排好两方的间距

白色主标识和合作名称在同一水平线上，以细竖线分开。两侧留白保持均衡，文字名称用开阔无衬线，背景采用深青和蓝黑。

## 让亮部在背景里缓慢穿过

流体折面不规则地翻卷，亮部占画面的少数区域。标识、分隔线和相对位置保持不动，避免节奏切换。

## 替换标识时重新配平

较长名称优先缩小字距或字号，以保持双方相近的重量。可替换主色与标识，但持续保留深底白字和宽阔留白。

## 配色与字形

深青蓝流体、中心白品牌与细竖线。

#16343f · #ffffff · #53879d · #507477 · #10212d

## 元素与制作规则

主品牌 / 分隔线 / coinbase 名称 / 流体底纹

- 标识固定不跳动，背景亮部缓慢穿过，强调合作身份。
- 内容聚焦合作关系，以持续留读代替功能展开。

## 内容替换

- 双方名称可替换，背景维持低对比与慢速。
- 保留品牌之间的间距和共同基线。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V316",
  "palette": [
    "#16343f",
    "#ffffff",
    "#53879d",
    "#507477",
    "#10212d"
  ],
  "typography": "深青蓝流体、中心白品牌与细竖线",
  "sample": "Grok × coinbase",
  "objects": [
    "主品牌",
    "分隔线",
    "coinbase 名称",
    "流体底纹"
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
      "timeSeconds": 6.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "合作标识",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "背景缓慢翻卷",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "亮部移动",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "品牌留读",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 20.0,
  "fontFamily": "Arial, sans-serif"
}
```
