# Ad Studio：贴链接出整套广告

输入链接后收拢周围海报，组织成标志、颜色、字体和产品素材。产品进入组合环，计数增长后才展开广告矩阵。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 34.7,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Ad Studio",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#fa4ca1"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Ad Studio",
        "accent": "#fa4ca1"
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

## 先建立品牌套件，再生成系列

输入链接后收拢周围海报，组织成标志、颜色、字体和产品素材。产品进入组合环，计数增长后才展开广告矩阵。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 输入品牌地址 |
| 3.00–5.50s | 品牌素材汇聚 |
| 5.50–8.00s | 品牌套件 |
| 8.00–11.00s | 产品素材 |
| 11.00–15.00s | 组合计数环 |
| 15.00–19.00s | 广告画廊 |
| 19.00–27.00s | 编辑单张广告 |
| 27.00–33.00s | 渠道预览 |
| 33.00–34.70s | 品牌 |

## 数量变化要有物体对应

产品沿圆环复制为多个候选，中央数字随数量增加。随后环上的候选展开为多排广告，让数量与结果规模相互印证。

```motion-demo
{
  "id": "clip-2",
  "title": "数量变化要有物体对应",
  "src": "demos/clip-2.html",
  "duration": 5,
  "status": "authored",
  "description": "11–16 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 选一张广告完成细修

从画廊抽出单张，依次更换衣服颜色、背景与标题，再置入社交媒体框。彩色光标带着边框移动，其他素材退出焦点。

## 换品牌时成套替换

品牌套件、产品和广告标题需共同更新，保留一个主题下多种版式与多个渠道的组合。

## 配色与字形

极简白底，素材承担多色，黑色标题与小型编辑边框保持清晰。。

#ffffff · #111111 · #fa4ca1 · #f0eddf · #3975ba

## 元素与制作规则

网址 / 品牌套件 / 产品照片 / 组合环 / 广告矩阵 / 彩色光标 / 渠道框

- 输入链接后收拢周围海报，组织成标志、颜色、字体和产品素材。产品进入组合环，计数增长后才展开广告矩阵。
- 产品沿圆环复制为多个候选，中央数字随数量增加。随后环上的候选展开为多排广告，让数量与结果规模相互印证。
- 从画廊抽出单张，依次更换衣服颜色、背景与标题，再置入社交媒体框。彩色光标带着边框移动，其他素材退出焦点。

## 内容替换

- 输入目标品牌套件与产品集，保留批量生成后局部编辑的流程。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Krea",
  "id": "V126",
  "palette": [
    "#ffffff",
    "#111111",
    "#fa4ca1",
    "#f0eddf",
    "#3975ba"
  ],
  "typography": "极简白底，素材承担多色，黑色标题与小型编辑边框保持清晰。",
  "sample": "Ad Studio",
  "objects": [
    "网址",
    "品牌套件",
    "产品照片",
    "组合环",
    "广告矩阵",
    "彩色光标",
    "渠道框"
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
      "timeSeconds": 5.25,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 15.0,
      "frameId": "K0058",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 19.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 33.0,
      "frameId": "K0125",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "输入品牌地址",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "品牌素材汇聚",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "品牌套件",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "产品素材",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "组合计数环",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "广告画廊",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "编辑单张广告",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "渠道预览",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "品牌",
      "end": 34.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 34.7,
  "fontFamily": "Arial, sans-serif"
}
```
