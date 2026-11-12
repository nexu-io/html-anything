# 模型发布｜Fable 5

先用图册建立视觉语境，再让植物、版画和微观纹理组成同一个数字。材质快速变化，识别轮廓始终稳定。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 20.416667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 17,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Fable 5",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c4654a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Fable 5",
        "accent": "#c4654a"
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

## 轮廓固定，媒介变化

米色自然史图册、版画与纸张纹理；结尾衬线标题配砖红底。

前段建立图册语境，中段让不同媒介共享数字 5 轮廓；观众识别依赖稳定外形而非固定纹理。

![9.00s · 构图参考](assets/reference-3.jpg)

## 用切镜更换材质

数字出现后以离散切镜更换材质，不能把跨素材变化解释为一个物体的连续形变。

最后素材散开，留出干净的产品标题；视觉密度从高到低。

```motion-demo
{
  "id": "clip-2",
  "title": "用切镜更换材质",
  "src": "demos/clip-2.html",
  "duration": 10.0,
  "status": "authored",
  "description": "5.5–15.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从图像密度收束到产品名

前段快切图册素材，5.5 秒后建立数字轮廓，后段加快材质变化；16.5 秒收束为砖红标题页。

| 时间 | 段落 |
|---|---|
| 0.00–3.50s | 自然史图册快切 |
| 3.50–5.50s | 器物与建筑图版 |
| 5.50–9.00s | 素材构成数字 5 |
| 9.00–13.00s | 轮廓保持、媒介切换 |
| 13.00–15.40s | 微观与植物数字 |
| 15.40–16.50s | 蝴蝶散开 |
| 16.50–19.30s | 砖红标题定格 |
| 19.30–20.42s | 图册回接 |

## 先换识别符，再配素材

替换主题相关的图册素材与数字；先定义统一轮廓再挑素材。

主识别符建议一个数字或短符号；复杂长词会破坏多材质匹配。

## 配色与字形

米色自然史图册、版画与纸张纹理；结尾衬线标题配砖红底。

#e7ddc5 · #343a2b · #c4654a · #4d753e · #385d9e

## 元素与制作规则

数字骨架 / 图册素材组 / 数字内部纹理 / 散开的蝴蝶 / 结尾产品名

- 前段建立图册语境，中段让不同媒介共享数字 5 轮廓；观众识别依赖稳定外形而非固定纹理。
- 数字出现后以离散切镜更换材质，不能把跨素材变化解释为一个物体的连续形变。
- 最后素材散开，留出干净的产品标题；视觉密度从高到低。

## 内容替换

- 替换主题相关的图册素材与数字；先定义统一轮廓再挑素材。
- 主识别符建议一个数字或短符号；复杂长词会破坏多材质匹配。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V005",
  "palette": [
    "#e7ddc5",
    "#343a2b",
    "#c4654a",
    "#4d753e",
    "#385d9e"
  ],
  "typography": "米色自然史图册、版画与纸张纹理；结尾衬线标题配砖红底",
  "sample": "Fable 5",
  "objects": [
    "数字骨架",
    "图册素材组",
    "数字内部纹理",
    "散开的蝴蝶",
    "结尾产品名"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/0f455356adc60de5ce09d4040119ed4f20bc45650f6bea6c16209818a63628ad",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/88694025037914cf7974065fb11bc1e8201f60848346dde1d4cfab25c2a15ae0",
      "timeSeconds": 3.5,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0083",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 16.5,
      "frameId": "K0100",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0107",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "自然史图册快切",
      "end": 3.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.5,
      "label": "器物与建筑图版",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "素材构成数字 5",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "轮廓保持、媒介切换",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "微观与植物数字",
      "end": 15.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.4,
      "label": "蝴蝶散开",
      "end": 16.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.5,
      "label": "砖红标题定格",
      "end": 19.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.3,
      "label": "图册回接",
      "end": 20.416667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 20.416667,
  "fontFamily": "Georgia, serif"
}
```
