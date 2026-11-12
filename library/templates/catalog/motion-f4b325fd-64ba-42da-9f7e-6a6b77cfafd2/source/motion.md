# 季度业绩｜2026 Q1 数据海报

用高密度色块与巨型数字制作季度快报。一屏只讲一个指标，底部信息条始终提供名称和注释。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 25.041667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Q1 2026",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#5b34ee"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Q1 2026",
        "accent": "#5b34ee"
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

## 巨字和色块共同构成海报

让字形占据大部分画幅，适度裁切边缘，彩色矩形紧密拼接。数字和单位保持一个阅读整体，固定页脚提供季度、指标名和说明。

## 指标逐个切换，不同时争抢

季度引导之后依次给收入、同比和留存。先让观众找到指标名称，再给主数字；每项完成一次阅读停顿，再切下一张。

| 内容槽位 | 排版约束 |
| --- | --- |
| 季度 | 建立开场主题 |
| 收入 | 金额与单位连在一起 |
| 增长与留存 | 百分号不脱离数字 |
| 注脚 | 位置固定，保持可读字号 |
| 署名 | 降低密度，结束整组海报 |

## 用撞色制造密度，用字重维持秩序

灰色底板上使用紫、荧光黄和亮绿，巨字以深色粗无衬线为主。注脚用较小常规字重，形成鲜明比例差；不要用过细标题抵消色块的力度。

## 换一组数据，就做成另一期

同步替换季度、指标名称、数值、单位和注释。先确认每个数字能在一屏内成立，再调整字宽与色块比例；必要时分两屏，不能为了塞下数据把注脚压得不可读。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#a3a099 · #202020 · #5b34ee · #f5ff41 · #28df68

## 元素与制作规则

巨型数字 / 彩色矩形 / 指标标签 / 底部注脚 / 署名

- 多种宽度的巨字与色块紧密拼接，裁切边缘形成密度；底部信息条固定。
- 每段只强调一个指标，先标签后数字，指标单位不得分离。

## 内容替换

- 可换季度和数据；保留数字层级、单位以及底部注释。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V101",
  "palette": [
    "#a3a099",
    "#202020",
    "#5b34ee",
    "#f5ff41",
    "#28df68"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Q1 2026",
  "objects": [
    "巨型数字",
    "彩色矩形",
    "指标标签",
    "底部注脚",
    "署名"
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
      "timeSeconds": 2.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e281202245e5fde95200c45fbe8d73b9960582337e8766f11fbbfb59af195471",
      "timeSeconds": 17.0,
      "frameId": "K0061",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/2eb4ab7dbfb86fc1fdd28fc4f0a138a384a8527585b5228b2f79440bf526ee49",
      "timeSeconds": 21.0,
      "frameId": "K0073",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "巨字 Q",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "季度拼贴",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "收入数字",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "同比指标",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "留存指标",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "设计宣言",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "制作署名",
      "end": 25.041667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 25.041667,
  "fontFamily": "Arial, sans-serif"
}
```
