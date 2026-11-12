# Uniqode｜点阵品牌短片

用同一种点阵媒介连接几何纹样、现实场景和品牌标记。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "UNIQODE",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#0c3dea"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "UNIQODE",
        "accent": "#0c3dea"
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

## 先统一媒介，再更换图像

网格的尺度和行列位置稳定，只改变蓝白分布。圆环、菱形与棋盘沿用同样的细单元。

```motion-demo
{
  "id": "clip-1",
  "title": "先统一媒介，再更换图像",
  "src": "demos/clip-1.html",
  "duration": 3.6,
  "status": "authored",
  "description": "0–3.6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 让城市进入同一张网格

城市轮廓压成明暗块后再点阵化；横向移动时保持建筑的整体身份，网格仍然固定。

```motion-demo
{
  "id": "clip-2",
  "title": "让城市进入同一张网格",
  "src": "demos/clip-2.html",
  "duration": 3.0999999999999996,
  "status": "authored",
  "description": "4.4–7.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用纯色收束复杂纹样

最后切换到干净蓝底，先出现白色字标，再留下独立图形。信息密度从高到低，给品牌留出阅读时间。

| 时间 | 段落 |
|---|---|
| 0.00–1.50s | 圆环与菱形 |
| 1.50–3.00s | 纹样切换 |
| 3.00–4.40s | 波纹扩散 |
| 4.40–7.80s | 城市点阵 |
| 7.80–9.50s | 蓝底字标 |
| 9.50–10.03s | 留下图形标记 |

## 配色与字形

轻型无衬线字标；蓝白双色小单元网格，几何形态、城市剪影和纯色落版。

#eaf2f5 · #101213 · #0c3dea · #9fc5e0 · #ffffff

## 元素与制作规则

固定细网格 / 蓝白符号单元 / 几何纹样 / 城市剪影 / 品牌字标

- 不移动整张网格，通过每个单元的亮暗和形态重排轮廓；多种画面共用同一采样密度。
- 从几何纹样进入城市时保留点阵媒介；最后才切到纯蓝背景，让品牌脱离网格清楚落定。
- 城市段用平移和轮廓替换形成行进感，避免每个点独立无方向乱跑。

## 内容替换

- 可换城市、图案和品牌名称；保留统一符号网格、双色关系与纯色收尾。
- 复杂素材先压成可辨认轮廓，避免把细节全塞进小格导致花屏。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Uniqode",
  "id": "V399",
  "palette": [
    "#eaf2f5",
    "#101213",
    "#0c3dea",
    "#9fc5e0",
    "#ffffff"
  ],
  "typography": "轻型无衬线字标；蓝白双色小单元网格，几何形态、城市剪影和纯色落版",
  "sample": "UNIQODE",
  "objects": [
    "固定细网格",
    "蓝白符号单元",
    "几何纹样",
    "城市剪影",
    "品牌字标"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/16a5e28e2f98c9ad2cab2ee7f7e76aa3bfd3d238a43b865e479b7eb44d636cd7",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/aeed19e8cb6666eca768f87e641a8c196487e22a9e6318a85a03374ad332fd0f",
      "timeSeconds": 1.5333333333333334,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/73ed26a0fb5a7fcb00b14a4c42351714cb86bb9486b1307056bb3e8521449f4b",
      "timeSeconds": 3.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/4617164fe88ce4672e29345edafe4700d0a691d3d1560413a85638cab6eb90c3",
      "timeSeconds": 4.4,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 7.8,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 9.266666666666667,
      "frameId": "K0047",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "圆环与菱形",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "纹样切换",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "波纹扩散",
      "end": 4.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.4,
      "label": "城市点阵",
      "end": 7.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.8,
      "label": "蓝底字标",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "留下图形标记",
      "end": 10.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.033333,
  "fontFamily": "Arial, sans-serif"
}
```
