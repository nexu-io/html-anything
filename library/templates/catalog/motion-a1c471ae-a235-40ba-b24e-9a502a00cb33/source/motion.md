# GPT-6 Cyber

把注意力留给一条能力主张。弧形地平线与中心光持续呼吸，产品名在同一位置接替文案。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 7.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "GPT-6 Cyber",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e4a96c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "GPT-6 Cyber",
        "accent": "#e4a96c"
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

## 中心光和文字共用一条轴

暗底下方放宽弧形边缘光，亮度集中在中间，向两侧衰减。白色无衬线标题位于弧线上方，金色用于背景和微粒，留出足够明暗差。

## 背景连着动，文字只换一次

保持地平线的锚点，微粒从中心向上稀疏扩散。主张替换成产品名时延续同一基线，不改变背景运动方向。

## 换主题时减少信息数量

替换短主张、产品名和光的色温即可。新文案仍保持一行，长名称优先减字号，保留弧线与文字之间的空隙。

## 配色与字形

黑底金色弧形地平线、上升微粒、居中白字。

#030303 · #ffffff · #e4a96c · #654125 · #111111

## 元素与制作规则

弧形边缘 / 中心光源 / 上升微粒 / 产品名

- 主体背景持续缓慢运动，文案在同一落点替换。
- 中心光与地平线固定锚定，微粒从亮点向上稀疏扩散。

## 内容替换

- 替换产品名和短句，保留低信息密度、长留读。
- 字数控制在一行内。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V327",
  "palette": [
    "#030303",
    "#ffffff",
    "#e4a96c",
    "#654125",
    "#111111"
  ],
  "typography": "黑底金色弧形地平线、上升微粒、居中白字",
  "sample": "GPT-6 Cyber",
  "objects": [
    "弧形边缘",
    "中心光源",
    "上升微粒",
    "产品名"
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
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.0,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 4.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "地平线与粒子",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "能力短句",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "切产品名",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "持续呼吸与留读",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 7.0,
  "fontFamily": "Arial, sans-serif"
}
```
