# Evergreen｜视觉系统总览

稳定的多格网格容纳不同小循环，只有右侧窄栏轮换主张，让丰富素材仍有阅读顺序。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 7.966667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.9,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Make Money Moves",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#0ce82a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Make Money Moves",
        "accent": "#0ce82a"
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

## 网格边界固定，格内各自动

各格保留黑色间隙和圆角，耳机、球体、卡片等物件在自己的裁切区域内运动。运动幅度保持克制，不能同时穿出格子破坏整体秩序。

```motion-demo
{
  "id": "clip-1",
  "title": "网格边界固定，格内各自动",
  "src": "demos/clip-1.html",
  "duration": 2.5,
  "status": "authored",
  "description": "0.5–3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 一条窄栏负责文案

主张、储蓄、优惠与费用依次在右栏替换，其他格子作为持续背景。荧光绿主色由紫、灰、白辅助，粗无衬线短句始终有足够对比。

## 替换为一套互相关联的物件

先设计固定网格，再分配产品、材质特写与短循环。文案栏可改，但内容数量要适应窄宽度；同一系列素材应共享颜色和照明方向。

## 配色与字形

无衬线粗短句置于网格窄栏；产品物件以轮廓和颜色建立识别。

#101010 · #f9f9f5 · #0ce82a · #7e36d5 · #d7ff38

## 元素与制作规则

不等宽网格 / 产品物件 / 局部小循环 / 竖向文案栏 / 品牌图标

- 稳定的多格网格容纳不同小循环，只有右侧窄栏轮换主张，让丰富素材仍有阅读顺序。
- 各格保留黑色间隙和圆角，耳机、球体、卡片等物件在自己的裁切区域内运动。运动幅度保持克制，不能同时穿出格子破坏整体秩序。
- 主张、储蓄、优惠与费用依次在右栏替换，其他格子作为持续背景。荧光绿主色由紫、灰、白辅助，粗无衬线短句始终有足够对比。

## 内容替换

- 先设计固定网格，再分配产品、材质特写与短循环。文案栏可改，但内容数量要适应窄宽度；同一系列素材应共享颜色和照明方向。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cash App",
  "id": "V359",
  "palette": [
    "#101010",
    "#f9f9f5",
    "#0ce82a",
    "#7e36d5",
    "#d7ff38"
  ],
  "typography": "无衬线粗短句置于网格窄栏；产品物件以轮廓和颜色建立识别",
  "sample": "Make Money Moves",
  "objects": [
    "不等宽网格",
    "产品物件",
    "局部小循环",
    "竖向文案栏",
    "品牌图标"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/b70bb4ba1e02dfc6e6d5b241e0493e4061072288cb2067053a1dc809b1fbe518",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/ca2de7520b5d2620ddc5bd8e318268fbf605c963c53d15fdb5a1eed7fcf5563b",
      "timeSeconds": 0.9917012448132779,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/2d67e56bc42b089066a672dc9d95cc1719e5cd323b6d1f1d53486908a19351b4",
      "timeSeconds": 2.6114799446749655,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/45153b6ab286dbcd749c7e4fd031c83dfbf2fe0343f33f7742696b112b1e186a",
      "timeSeconds": 3.9668049792531117,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/3899aa05f5114bd86eab93dbc8d5d8cdb869a86fa7fc5db3818d316c2a26e9e5",
      "timeSeconds": 4.95850622406639,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9ab7e3ba67a475e71544b88fcd250be09c3819f9490bb1bbd65991c855fce64e",
      "timeSeconds": 6.710511756569848,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "多格视觉系统",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "右栏主张",
      "end": 2.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.7,
      "label": "储蓄信息",
      "end": 3.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.9,
      "label": "优惠",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "费用",
      "end": 6.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.7,
      "label": "品牌结尾",
      "end": 7.966667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 7.966667,
  "fontFamily": "Arial, sans-serif"
}
```
