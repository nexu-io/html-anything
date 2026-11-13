# Hermes 接入 Omarchy

透视线从中央小孔扩展成四面网格，前进一段后向两边收窄，留出双标志的对称位置。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 25.125,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "OMARCHY × NOUS",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#93b47b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "OMARCHY × NOUS",
        "accent": "#93b47b"
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

## 让通道变成合作双方的舞台

透视线从中央小孔扩展成四面网格，前进一段后向两边收窄，留出双标志的对称位置。

```motion-demo
{
  "id": "clip-1",
  "title": "让通道变成合作双方的舞台",
  "src": "demos/clip-1.html",
  "duration": 4,
  "status": "authored",
  "description": "1–5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 所有元素共享显像管质感

线条使用低饱和绿白，黑底不加其他彩色装饰。扫描纹、少量抖动与轻微色散统一覆盖网格和标志。

## 由平面标志折回空间

双标志停留后各自折成网片，再拉长成新的通道，最终淡黑。替换合作方时保持左右重量一致，折叠动作在留读后发生。

| 时间 | 段落 |
|---|---|
| 0.00–1.00s | 暗场 |
| 1.00–7.00s | 隧道展开 |
| 7.00–10.00s | 隧道收窄 |
| 10.00–15.00s | 双品牌 |
| 15.00–18.00s | 标志折叠 |
| 18.00–22.00s | 网格折片 |
| 22.00–24.00s | 恢复通道 |
| 24.00–25.12s | 淡出 |

## 配色与字形

黑底绿色 CRT 网格，标志与线条带微弱辉光和扫描纹。。

#000000 · #e0ead7 · #93b47b · #355c3f · #17241c

## 元素与制作规则

透视隧道 / 双品牌标志 / 折叠网片 / 扫描纹

- 透视线从中央小孔扩展成四面网格，前进一段后向两边收窄，留出双标志的对称位置。
- 线条使用低饱和绿白，黑底不加其他彩色装饰。扫描纹、少量抖动与轻微色散统一覆盖网格和标志。
- 双标志停留后各自折成网片，再拉长成新的通道，最终淡黑。替换合作方时保持左右重量一致，折叠动作在留读后发生。

## 内容替换

- 替换两端标志，保留通道—双标志—折回通道的循环关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Nous Research",
  "id": "V132",
  "palette": [
    "#000000",
    "#e0ead7",
    "#93b47b",
    "#355c3f",
    "#17241c"
  ],
  "typography": "黑底绿色 CRT 网格，标志与线条带微弱辉光和扫描纹。",
  "sample": "OMARCHY × NOUS",
  "objects": [
    "透视隧道",
    "双品牌标志",
    "折叠网片",
    "扫描纹"
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
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 10.0,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 15.0,
      "frameId": "K0047",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 22.0,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/67907aab72ffa5d0e1b182ba9a8a71b06efe4c647d1cc6de9b1300bbcfe01080",
      "timeSeconds": 24.0,
      "frameId": "K0078",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "暗场",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "隧道展开",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "隧道收窄",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "双品牌",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "标志折叠",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "网格折片",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "恢复通道",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "淡出",
      "end": 25.125,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 25.125,
  "fontFamily": "Arial, sans-serif"
}
```
