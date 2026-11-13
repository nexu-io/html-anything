# TIDAL｜文字主视觉 15 秒版

在十五秒内保留致意、立场、音乐、创作者与听众五个重音；每次只读一组词。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.01452,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.5,
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
  "duration": 3.999999999999999,
  "status": "authored",
  "description": "4.2–8.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 句子接力而非逐页字幕

把前一关键词的放大或移出当作下一句的入场空间。ARTISTS 与 FANS 使用相似形变形成呼应，收尾回到稳定的三行品牌句。

## 换文案先重新安排重音

可替换品牌和社群称谓，保留呼喊式短句与强弱词层级。缩短长版本时优先删除完整例举组，留下核心承诺，不把每句都加倍加速。

## 配色与字形

极粗窄体大写字；短词以巨大字号占据中心。

#10362f · #dfff58 · #c400e8 · #1b998d · #430453

## 元素与制作规则

菱形 / 窄体大字 / 关键词 / 对角遮罩 / 品牌标

- 主词使用极粗窄体，尽量一至两行；连接词缩小放在上下或侧边。文字可在入场时裁切，但落定的关键词要完整可读。
- 菱形从中心扩张覆盖画面，或四角向内合拢。用青绿／深绿和亮紫／深紫交替分组，柠檬黄突出情绪重词。
- 把前一关键词的放大或移出当作下一句的入场空间。ARTISTS 与 FANS 使用相似形变形成呼应，收尾回到稳定的三行品牌句。
- 可替换品牌和社群称谓，保留呼喊式短句与强弱词层级。缩短长版本时优先删除完整例举组，留下核心承诺，不把每句都加倍加速。

## 内容替换

- 替换品牌、受众群与宣言；按词长重新排字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "TIDAL",
  "id": "V390",
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
      "path": "assets/reference-1.webp",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 0.5452199999999999,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.39058,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 7.5492,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 11.78514,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 13.966019999999999,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌符号",
      "end": 0.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.6,
      "label": "向听众致意",
      "end": 2.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.4,
      "label": "关键词向下接续",
      "end": 4.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.4,
      "label": "品牌立场",
      "end": 7.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.6,
      "label": "音乐与创作者",
      "end": 11.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.8,
      "label": "听众",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "品牌收束",
      "end": 15.01452,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.01452,
  "fontFamily": "Arial, sans-serif"
}
```
