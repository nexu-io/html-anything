# Uniqode｜点阵文字聚散

让零散颗粒拼成一句可阅读的话，再用同一批颗粒拆开。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.466667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "IRL TO | URL & BACK | AGAIN",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#95b8dd"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "IRL TO | URL & BACK | AGAIN",
        "accent": "#95b8dd"
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

## 把字形作为颗粒的共同目标

浅蓝颗粒在黑底上从不同位置进入，先显现局部笔画，再形成完整三行文字。颗粒不需要按字符逐个出现。

```motion-demo
{
  "id": "clip-1",
  "title": "把字形作为颗粒的共同目标",
  "src": "demos/clip-1.html",
  "duration": 2.2,
  "status": "authored",
  "description": "0–2.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 先读完整句子，再让它散开

2–4 秒以完整句子为主，外围只保留轻微颗粒变化；退场沿原来的粒子身份拆开，不突然更换一套噪点。

```motion-demo
{
  "id": "clip-2",
  "title": "先读完整句子，再让它散开",
  "src": "demos/clip-2.html",
  "duration": 1.6000000000000005,
  "status": "authored",
  "description": "3.8–5.4 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 以字宽控制内容容量

优先用短句与粗笔画，换词后重新生成字形采样；保留三行重心与聚散次序。

| 时间 | 段落 |
|---|---|
| 0.00–1.00s | 零散颗粒 |
| 1.00–2.00s | 向字形聚拢 |
| 2.00–4.00s | 三行文字稳定 |
| 4.00–5.20s | 开始拆散 |
| 5.20–5.47s | 回到稀疏颗粒 |

## 配色与字形

三行点阵无衬线短句；近黑底、浅蓝微符号，颗粒尺寸稳定。

#0c0d0e · #95b8dd · #95b8dd · #253c59 · #ffffff

## 元素与制作规则

浅蓝颗粒 / 三行字形目标 / 散开位置 / 黑色背景

- 颗粒先向字形目标聚集，形成完整三行句子；停留后再离开字形并消失。
- 颗粒大小和颜色保持一致，变化来自位置和密度；形成文字后不能一直随机漂移。
- 每个颗粒拥有可持续追踪的起点和目标，聚散使用同一组元素。

## 内容替换

- 可替换三行短句，使用竖线分行；保留散→聚→读→散的阶段比例。
- 每行保持相近视觉宽度，避免细笔画、过小字号或过长句子导致点阵难读。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Uniqode",
  "id": "V400",
  "palette": [
    "#0c0d0e",
    "#95b8dd",
    "#95b8dd",
    "#253c59",
    "#ffffff"
  ],
  "typography": "三行点阵无衬线短句；近黑底、浅蓝微符号，颗粒尺寸稳定",
  "sample": "IRL TO | URL & BACK | AGAIN",
  "objects": [
    "浅蓝颗粒",
    "三行字形目标",
    "散开位置",
    "黑色背景"
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
      "path": "assets/reference-2.jpg",
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/dd8e15904ed9d5dff013765ca51e2b2281a9d1484d6326d5dd966df6b3175314",
      "timeSeconds": 2.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/25e916dc30ddf5a5608b13138cb0ae3dd60e072f34f89bb0e12f044a46c34551",
      "timeSeconds": 4.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 5.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "零散颗粒",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "向字形聚拢",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "三行文字稳定",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "开始拆散",
      "end": 5.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.2,
      "label": "回到稀疏颗粒",
      "end": 5.466667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.466667,
  "fontFamily": "Arial, sans-serif"
}
```
