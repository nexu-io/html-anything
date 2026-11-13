# Identity Digital｜品牌主视觉

把域名中的句点变成转场主角：长网址被拆开，句点放大成几何场景，最后落到更简短的行业后缀。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 29.916667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 20.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Get Your Dot.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e43e36"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Get Your Dot.",
        "accent": "#e43e36"
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

## 从网址中的点出发

先把完整长网址放入渐变胶囊，随后推近句点。红点离开文字后仍保留颜色与中心，成为下一组圆形图案的起点。

```motion-demo
{
  "id": "clip-1",
  "title": "从网址中的点出发",
  "src": "demos/clip-1.html",
  "duration": 6,
  "status": "authored",
  "description": "2–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 不同后缀对应不同图形

摄影可用光圈，游戏可用像素格，旅行可用地平线，媒体可用色条。后缀固定在中心留白，图案在其周围运动，避免图案盖住短词。

## 颜色与字长共同控制密度

紫、黄、红、粉、绿按段落切换，黑字或白字要与底色对比。地址胶囊可横向伸长，但最终后缀保持大字号与充足留白。

## 迁移时替换语义而非只换字

选择新业务真正适用的后缀或关键词，并为它安排一个可理解的几何隐喻。结尾收回点和品牌，结束图形例举。

## 配色与字形

圆润无衬线；域名字号随长度收放，后缀独立强调。

#4618dc · #10151d · #e43e36 · #f0d84e · #ec9cf0 · #54c763

## 元素与制作规则

地址胶囊 / 红色句点 / 同心圆 / 行业后缀 / 图形纹样

- 先把完整长网址放入渐变胶囊，随后推近句点。红点离开文字后仍保留颜色与中心，成为下一组圆形图案的起点。
- 摄影可用光圈，游戏可用像素格，旅行可用地平线，媒体可用色条。后缀固定在中心留白，图案在其周围运动，避免图案盖住短词。
- 紫、黄、红、粉、绿按段落切换，黑字或白字要与底色对比。地址胶囊可横向伸长，但最终后缀保持大字号与充足留白。
- 选择新业务真正适用的后缀或关键词，并为它安排一个可理解的几何隐喻。结尾收回点和品牌，结束图形例举。

## 内容替换

- 可迁移到域名、身份与命名服务；保留符号→语义图案的关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Identity Digital",
  "id": "V381",
  "palette": [
    "#4618dc",
    "#10151d",
    "#e43e36",
    "#f0d84e",
    "#ec9cf0",
    "#54c763"
  ],
  "typography": "圆润无衬线；域名字号随长度收放，后缀独立强调",
  "sample": "Get Your Dot.",
  "objects": [
    "地址胶囊",
    "红色句点",
    "同心圆",
    "行业后缀",
    "图形纹样"
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
      "timeSeconds": 3.9112192860454336,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.987482614742698,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 11.983310152990265,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/b32bcb033e2164abc8a4b203f29aae9daec41ec545d6b53faaed20f36de53e29",
      "timeSeconds": 24.965229485396385,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 26.962447844228095,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "网址胶囊",
      "end": 3.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.9,
      "label": "句点放大",
      "end": 5.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.6,
      "label": "圆形接力",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "短域名",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "第二域名",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "后缀图形系列",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "圆点聚拢",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "品牌收束",
      "end": 29.916667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 29.916667,
  "fontFamily": "Arial, sans-serif"
}
```
