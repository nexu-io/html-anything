# Bolt Template Marketplace｜模板市场

先展示可选模板的范围，再放大一个能浏览的完整网站，最后用提示词把模板改成另一个业务。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 31.016667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Bolt Templates",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#1286e9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Bolt Templates",
        "accent": "#1286e9"
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

## 矩阵负责选择，单页负责证明

蓝黑光场里排列多张完整网页缩略图，间距统一。选中模板从网格所在位置放大，其他页面退后；浏览期间保留网页内部的纵向移动。

```motion-demo
{
  "id": "clip-1",
  "title": "矩阵负责选择，单页负责证明",
  "src": "demos/clip-1.html",
  "duration": 9,
  "status": "authored",
  "description": "3–12 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 改造前后保留版式对应

展示修改需求后，把同一网页的题材、色板和图片换掉。保留关键区域位置，使观众能看出改了什么；修改框用深色面板，与白色网页形成对照。

## 不要让模板数量压过选中的作品

开始和结尾可以展示多模板，中段只深入一个。品牌背景以深蓝、亮蓝与白色为主，模板内容可多彩但不改外部统一框架。

## 换主题准备一组可比较素材

至少提供三类模板及一个完整改造案例。新主题文案、图像与主色成套替换，结尾保留简短行动入口。

## 配色与字形

白色无衬线说明；模板各自保留标题与图片风格。

#061325 · #ffffff · #1286e9 · #75d6f9 · #252b37

## 元素与制作规则

模板矩阵 / 透视带 / 选中网页 / 类别标签 / 修改输入 / 前后结果

- 蓝黑光场里排列多张完整网页缩略图，间距统一。选中模板从网格所在位置放大，其他页面退后；浏览期间保留网页内部的纵向移动。
- 展示修改需求后，把同一网页的题材、色板和图片换掉。保留关键区域位置，使观众能看出改了什么；修改框用深色面板，与白色网页形成对照。
- 开始和结尾可以展示多模板，中段只深入一个。品牌背景以深蓝、亮蓝与白色为主，模板内容可多彩但不改外部统一框架。
- 至少提供三类模板及一个完整改造案例。新主题文案、图像与主色成套替换，结尾保留简短行动入口。

## 内容替换

- 保留集合→单例→改造→结果；替换模板类别和业务案例。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Bolt",
  "id": "V373",
  "palette": [
    "#061325",
    "#ffffff",
    "#1286e9",
    "#75d6f9",
    "#252b37"
  ],
  "typography": "白色无衬线说明；模板各自保留标题与图片风格",
  "sample": "Bolt Templates",
  "objects": [
    "模板矩阵",
    "透视带",
    "选中网页",
    "类别标签",
    "修改输入",
    "前后结果"
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
      "path": "https://r.open-design.ai/files/c1da6dd56229327053fe419083870e84019cc41f019821accd8ddc541012f4cd",
      "timeSeconds": 6.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 17.0,
      "frameId": "K0068",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 21.0,
      "frameId": "K0083",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 28.0,
      "frameId": "K0112",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "透视模板带",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "模板矩阵",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "选择作品集",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "浏览页面",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "类别展示",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "修改提示",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "改造结果",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "价值短句",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "开始入口",
      "end": 31.016667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 31.016667,
  "fontFamily": "Arial, sans-serif"
}
```
