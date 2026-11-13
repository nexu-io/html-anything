# 几何图案循环 · 10.0 秒

四组满幅几何纹样依次变化：折角的硬节奏转为柔软波浪，再落到不同大小的圆点。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Pattern moves",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#424ad6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Pattern moves",
        "accent": "#424ad6"
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

## 让相邻条带共享节拍

同类形状用固定间距重复，折点上下移动时相邻条带保持对应。图案超出画幅边缘，避免出现外框。

```motion-demo
{
  "id": "clip-1",
  "title": "让相邻条带共享节拍",
  "src": "demos/clip-1.html",
  "duration": 2.5,
  "status": "authored",
  "description": "0–2.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 每组只用两个颜色

黄蓝、黄红、深浅粉、深浅蓝分别成组。切换时同时更换形状族与色组，组内则只做形变和位移，保持整体性。

## 形状节奏由硬转软

折块使用短促错位；波浪用连续起伏；圆点以不同半径穿过画面。新品牌可替换色板，但保留每组形状的动作特性和满幅密度。

## 配色与字形

无文字的满幅图形；锋利折角与软波浪对比。

#fbdc20 · #15113d · #424ad6 · #ee477a · #f5aab7

## 元素与制作规则

折角条带 / 错位块 / 波浪边界 / 圆点

- 同类形状用固定间距重复，折点上下移动时相邻条带保持对应。图案超出画幅边缘，避免出现外框。
- 黄蓝、黄红、深浅粉、深浅蓝分别成组。切换时同时更换形状族与色组，组内则只做形变和位移，保持整体性。
- 折块使用短促错位；波浪用连续起伏；圆点以不同半径穿过画面。新品牌可替换色板，但保留每组形状的动作特性和满幅密度。

## 内容替换

- 替换双色组合；保留条带、折块、波浪、圆点四种运动族。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Miro",
  "id": "V350",
  "palette": [
    "#fbdc20",
    "#15113d",
    "#424ad6",
    "#ee477a",
    "#f5aab7"
  ],
  "typography": "无文字的满幅图形；锋利折角与软波浪对比",
  "sample": "Pattern moves",
  "objects": [
    "折角条带",
    "错位块",
    "波浪边界",
    "圆点"
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
      "timeSeconds": 2.533333333333333,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 7.733333333333333,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黄蓝折角",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "黄红折块",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "粉色波浪",
      "end": 7.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.7,
      "label": "蓝底圆点",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.0,
  "fontFamily": "Arial, sans-serif"
}
```
