# TIDAL｜文字主视觉 60 秒版

把文案当作主角：短词按语义重音放大、挤入和接续，菱形负责把文字段落推向下一组颜色。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 60.018156,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 20.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "TIDAL FOR YOUR MUSIC",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c400e8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "TIDAL FOR YOUR MUSIC",
        "accent": "#c400e8"
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

## 短词占满，长句退后

主词使用极粗窄体，尽量一至两行；连接词缩小放在上下或侧边。文字可在入场时裁切，但落定的关键词要完整可读。

## 菱形是换色的转场孔

菱形从中心扩张覆盖画面，或四角向内合拢。用青绿／深绿和亮紫／深紫交替分组，柠檬黄突出情绪重词。

```motion-demo
{
  "id": "clip-2",
  "title": "菱形是换色的转场孔",
  "src": "demos/clip-2.html",
  "duration": 5,
  "status": "authored",
  "description": "12–17 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 句子接力而非逐页字幕

把前一关键词的放大或移出当作下一句的入场空间。ARTISTS 与 FANS 使用相似形变形成呼应，收尾回到稳定的三行品牌句。

## 换文案先重新安排重音

可替换品牌和社群称谓，保留呼喊式短句与强弱词层级。中段可替换为新品牌的用户群像，例举之间保持相似句式与不同的关键词。

## 配色与字形

极粗窄体大写字；短词以巨大字号占据中心。

#10362f · #dfff58 · #c400e8 · #1b998d · #430453

## 元素与制作规则

菱形 / 窄体大字 / 关键词 / 对角遮罩 / 品牌标

- 主词使用极粗窄体，尽量一至两行；连接词缩小放在上下或侧边。文字可在入场时裁切，但落定的关键词要完整可读。
- 菱形从中心扩张覆盖画面，或四角向内合拢。用青绿／深绿和亮紫／深紫交替分组，柠檬黄突出情绪重词。
- 把前一关键词的放大或移出当作下一句的入场空间。ARTISTS 与 FANS 使用相似形变形成呼应，收尾回到稳定的三行品牌句。
- 可替换品牌和社群称谓，保留呼喊式短句与强弱词层级。中段可替换为新品牌的用户群像，例举之间保持相似句式与不同的关键词。

## 内容替换

- 替换品牌、受众群与宣言；按词长重新排字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "TIDAL",
  "id": "V389",
  "palette": [
    "#10362f",
    "#dfff58",
    "#c400e8",
    "#1b998d",
    "#430453"
  ],
  "typography": "极粗窄体大写字；短词以巨大字号占据中心",
  "sample": "TIDAL FOR YOUR MUSIC",
  "objects": [
    "菱形",
    "窄体大字",
    "关键词",
    "对角遮罩",
    "品牌标"
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
      "timeSeconds": 9.02151827658096,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 13.031081955061385,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 23.05499115126245,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 35.083682186703726,
      "frameId": "K0119",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 53.126718739865645,
      "frameId": "K0182",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "几何开场",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "向听众致意",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "仍在这里",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "相信音乐",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "创作者与听众",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "不同听众群像",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "共同立场",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "新的聆听方式",
      "end": 53,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 53,
      "label": "品牌收束",
      "end": 60.018156,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 60.018156,
  "fontFamily": "Arial, sans-serif"
}
```
