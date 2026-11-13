# Wise｜字体与货币符号动效

先说明字体从哪里来，再展示字形细节，最后把同一套字应用到不同货币和配色中。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.366667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 14.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "WISE SANS",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#a6ef67"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "WISE SANS",
        "accent": "#a6ef67"
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

## 把完整句子拆成逐行增长

主张每次新增一行，整体始终围绕版心组织。深绿与亮绿、白色互换，保持高对比和紧凑节奏。

```motion-demo
{
  "id": "clip-1",
  "title": "把完整句子拆成逐行增长",
  "src": "demos/clip-1.html",
  "duration": 2.7,
  "status": "authored",
  "description": "0.8–3.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从文字来源进入字形细节

素材窗口保持同一位置与圆角，内部文字快速切换。随后放大单个字母，让边缘超出画布，再收回完整字母表。

![9.00s · 构图参考](assets/reference-4.webp)

## 用应用色卡验证同一种字

每张色卡只留一个三字母缩写，字重和中心位置不变。背景与文字成对换色，快切形成应用范围。

```motion-demo
{
  "id": "clip-3",
  "title": "用应用色卡验证同一种字",
  "src": "demos/clip-3.html",
  "duration": 3.4000000000000004,
  "status": "authored",
  "description": "13.6–17 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换内容也保留讲述顺序

适用于字体、视觉系统或符号系统发布：先命名，再给来源，再看结构，最后看应用。

| 时间 | 段落 |
|---|---|
| 0.00–0.90s | 字体名称 |
| 0.90–3.70s | 逐行主张 |
| 3.70–5.50s | 灵感来源主张 |
| 5.50–9.20s | 各地文字取样 |
| 9.20–11.40s | 字形局部特写 |
| 11.40–13.70s | 完整字母表 |
| 13.70–17.00s | 货币缩写快切 |
| 17.00–17.37s | 回到字体名称 |

## 配色与字形

极粗无衬线紧凑排字；深绿与荧光绿反差，字形特写、字母表与货币缩写色卡。

#173d00 · #a6ef67 · #a6ef67 · #ffffff · #a7e4e1

## 元素与制作规则

大字标题 / 逐行句子 / 圆角图像窗口 / 放大字形 / 字母表 / 货币缩写

- 开场给字体名称，接着逐行添加句子；新行推动已有文字重新分配高度。
- 用小圆角窗口连续更换真实文字素材，再把单个字母放大到出画，说明字形来源与细节。
- 最后从完整字母表切到多组货币缩写，不同色卡沿用相同字重和中心锚点。

## 内容替换

- 替换品牌字体、主张、文字素材与行业缩写；保留名称→来源→细节→字符集→应用的叙事顺序。
- 标题保持极粗字重与紧凑行距；应用缩写以3个字符左右为宜。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Wise",
  "id": "V401",
  "palette": [
    "#173d00",
    "#a6ef67",
    "#a6ef67",
    "#ffffff",
    "#a7e4e1"
  ],
  "typography": "极粗无衬线紧凑排字；深绿与荧光绿反差，字形特写、字母表与货币缩写色卡",
  "sample": "WISE SANS",
  "objects": [
    "大字标题",
    "逐行句子",
    "圆角图像窗口",
    "放大字形",
    "字母表",
    "货币缩写"
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
      "timeSeconds": 0.9333333333333333,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/5450395995456b594dadb2e8884d80898f07e3105b38f0274be90dd0151c1890",
      "timeSeconds": 5.566666666666666,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 13.733333333333333,
      "frameId": "K0065",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 17.0,
      "frameId": "K0087",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "字体名称",
      "end": 0.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.9,
      "label": "逐行主张",
      "end": 3.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.7,
      "label": "灵感来源主张",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "各地文字取样",
      "end": 9.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.2,
      "label": "字形局部特写",
      "end": 11.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.4,
      "label": "完整字母表",
      "end": 13.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.7,
      "label": "货币缩写快切",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "回到字体名称",
      "end": 17.366667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.366667,
  "fontFamily": "Arial, sans-serif"
}
```
