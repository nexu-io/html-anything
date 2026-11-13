# ElevenLabs｜Scribe v2

把转录能力讲成具体的文本操作。每项能力都有一个清楚的输入和变化：时间定位、说话人、专有词纠正、实体分类。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 51.333372,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Scribe v2",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d9763b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Scribe v2",
        "accent": "#d9763b"
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

## 版本与指标只负责建立背景

开头用规则网格、图块和版本标记建立产品身份，随后展示同口径指标。柱状比较保持统一基线、单位和标签，不让柱高替代必要的说明。

白底黑字为主，深色段落负责节奏切换。暖色或绿色用于当前词与标记；正文用可长时间阅读的无衬线字，数字和时间码保持对齐。

## 让文本沿时间展开

转录按说话人拆成段落，时间轴位于固定位置，当前段落与对应时间范围联动。逐词出现时保留自然语组，避免每个字都像独立按钮。

## 纠错在原词位完成

先显示容易混淆的词，再在同一位置替换为正确专有词。提示词或词库放在旁侧，使用短连接说明影响；不通过整段重排掩盖具体变化。

```motion-demo
{
  "id": "clip-3",
  "title": "纠错在原词位完成",
  "src": "demos/clip-3.html",
  "duration": 11,
  "status": "authored",
  "description": "23–34 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 实体类别与词语一一对应

姓名、组织或敏感信息用稳定颜色标注，类别表与正文同步突出同一项。需要遮挡信息时，只作用于该字段，保留句子上下文。

换行业时准备新词表、说话内容与实体类别，保留词位、时间和类别之间的准确对应。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f6f0 · #161616 · #d9763b · #7fb7ae · #d9d6c9

## 元素与制作规则

版本圆标 / 对比柱 / 时间轴 / 说话人段落 / 纠错词 / 实体标签 / 连线

- 先介绍测量维度，再用具体文本变化解释能力
- 纠错发生在同一词位，旧词退场后新词替换；实体标色与右侧类别对应
- 时间轴和转录块用位置与连线建立音频时间关系

## 内容替换

- 可迁移至结构化理解产品，保留原输入→改正→分类与定位
- 真实能力评估需独立数据；演示中的数字不能当检测结果

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "ElevenLabs",
  "id": "V295",
  "palette": [
    "#f7f6f0",
    "#161616",
    "#d9763b",
    "#7fb7ae",
    "#d9d6c9"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Scribe v2",
  "objects": [
    "版本圆标",
    "对比柱",
    "时间轴",
    "说话人段落",
    "纠错词",
    "实体标签",
    "连线"
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
      "timeSeconds": 8.000006087662337,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 17.000012936282467,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 30.000022828733766,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 37.00002815543831,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 46.00003500405844,
      "frameId": "K0097",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "网格与图块",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "版本标记",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "指标比较",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "语言覆盖",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "时间轴",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "说话人",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "专有词纠正",
      "end": 30.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30.0,
      "label": "逐词字幕",
      "end": 34.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34.0,
      "label": "准确性主张",
      "end": 37.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37.0,
      "label": "实体表",
      "end": 41.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41.0,
      "label": "敏感信息标注",
      "end": 46.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46.0,
      "label": "品牌",
      "end": 51.333372,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 51.333372,
  "fontFamily": "Arial, sans-serif"
}
```
