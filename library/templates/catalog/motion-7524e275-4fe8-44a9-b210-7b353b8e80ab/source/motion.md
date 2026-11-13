# AI Grand Prix 无人机赛

黑色笔画从分散段落组合成 AI–GP，橙红控制框、交叉线和定位点随笔画一起出现。副标题和主办方上下对齐。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.5105,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "AI–GP",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c44829"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "AI–GP",
        "accent": "#c44829"
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

## 让字标像工程零件一样就位

黑色笔画从分散段落组合成 AI–GP，橙红控制框、交叉线和定位点随笔画一起出现。副标题和主办方上下对齐。

```motion-demo
{
  "id": "clip-1",
  "title": "让字标像工程零件一样就位",
  "src": "demos/clip-1.html",
  "duration": 2.5,
  "status": "authored",
  "description": "0.5–3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 线稿与像素块承担转场

灰色技术图始终低对比；大灰块遮住画面后切到橙红立体图标。图标轮换时保持中心锚点，背景可旋转但不抢主体。

## 从赛事标题收向徽标

先留读赛事名称，再用数个旋转符号加快节奏，最后停在品牌徽标。换活动时保留工程排版、橙色点缀与硬切的工业感。

| 时间 | 段落 |
|---|---|
| 0.00–0.60s | 像素遮挡 |
| 0.60–1.80s | 字标拆件 |
| 1.80–5.00s | 赛事信息 |
| 5.00–6.00s | 碎块转场 |
| 6.00–9.00s | 三维图标旋转 |
| 9.00–10.51s | 徽标 |

## 配色与字形

浅灰工程线稿、黑色切割字与少量橙红边线。。

#dbdbd9 · #101010 · #c44829 · #a4a4a2 · #f2f2f0

## 元素与制作规则

工程图底纹 / 切割字标 / 橙色控制框 / 像素遮挡块 / 三维徽标

- 黑色笔画从分散段落组合成 AI–GP，橙红控制框、交叉线和定位点随笔画一起出现。副标题和主办方上下对齐。
- 灰色技术图始终低对比；大灰块遮住画面后切到橙红立体图标。图标轮换时保持中心锚点，背景可旋转但不抢主体。
- 先留读赛事名称，再用数个旋转符号加快节奏，最后停在品牌徽标。换活动时保留工程排版、橙色点缀与硬切的工业感。

## 内容替换

- 替换赛事名、年份与标志，沿用组装字标到三维徽标的结构。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anduril",
  "id": "V118",
  "palette": [
    "#dbdbd9",
    "#101010",
    "#c44829",
    "#a4a4a2",
    "#f2f2f0"
  ],
  "typography": "浅灰工程线稿、黑色切割字与少量橙红边线。",
  "sample": "AI–GP",
  "objects": [
    "工程图底纹",
    "切割字标",
    "橙色控制框",
    "像素遮挡块",
    "三维徽标"
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
      "timeSeconds": 0.6339666666666667,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 1.8018,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 5.005,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/447c7e0c7ae39dbf7dec4c91eb69a08ba7e26bb6b84f33b92436829cb9669704",
      "timeSeconds": 6.006,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 9.009,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "像素遮挡",
      "end": 0.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.6,
      "label": "字标拆件",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "赛事信息",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "碎块转场",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "三维图标旋转",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "徽标",
      "end": 10.5105,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.5105,
  "fontFamily": "Arial, sans-serif"
}
```
