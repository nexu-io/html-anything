# Le Chat｜品牌发布

把助手的多种能力组织成连续的提问与回答。观众始终先理解问题，再看到与问题相符的结果；能力切换靠结果形态完成，不靠重复口号。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 76.233333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Ask Le Chat",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed602a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Ask Le Chat",
        "accent": "#ed602a"
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

## 每个问题，都落到一种结果

输入条承担开场，提交后让回答占据前景。资讯用摘要，推荐用列表，识图用设备与图片，数据用图表，代码用等宽文本；结果不能全部套成同一种卡片。

## 深色空间里的阅读层次

用接近黑色的背景托住浅色文字，橙色只强调输入、当前操作与品牌细节。标题用紧凑的无衬线粗体，回复正文保持常规字重；代码区独立使用等宽字形。

面板切换时可以倾斜、后退、叠放，重要文字开始阅读时回到接近正视角。前景答案最亮，历史内容降低对比，避免同时出现多个阅读中心。

## 把七种能力串成一次演示

沿资讯、推荐、识图、图像生成、数据、代码、规划推进。相邻能力可以直接切换，但每次都要重新建立问题；复杂结果比短问句停留更久。

末尾把零散色块压成横向像素带，再收束为品牌标记。像素段负责收尾，不再追加新能力。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 网格入口 |
| 3.00–6.00s | 提问按钮 |
| 6.00–13.00s | 实时资讯 |
| 13.00–17.00s | 推荐列表 |
| 17.00–22.00s | 手机识图 |
| 22.00–36.00s | 生成图像 |
| 36.00–46.00s | 数据分析 |
| 46.00–58.00s | 代码调试 |
| 58.00–70.00s | 规划任务 |
| 70.00–76.23s | 像素品牌收尾 |

## 迁移到另一个助手

先替换问题集合，再准备匹配的回复、图像、图表和代码。品牌色、输入文案、头像与像素标记一起更换；保留提问先于回答，以及不同结果类型之间的视觉差异。

## 配色与字形

无衬线界面文字与清晰大小层级。

#111315 · #ffffff · #ed602a · #44464a · #e6b838

## 元素与制作规则

输入条 / 回复面板 / 设备 / 图像组 / 像素标记

- 每个能力先提问、再出现对应结果，不能只播放无上下文成果
- 卡片在深色空间前后倾斜，文字阅读时回到较正视角
- 末尾横向像素色带收束为品牌标记

## 内容替换

- 迁移保留提问→等待→结果的回合结构，替换实际业务问题
- 图像、数据、代码三个结果类型保持可区分

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Mistral",
  "id": "V230",
  "palette": [
    "#111315",
    "#ffffff",
    "#ed602a",
    "#44464a",
    "#e6b838"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Ask Le Chat",
  "objects": [
    "输入条",
    "回复面板",
    "设备",
    "图像组",
    "像素标记"
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
      "timeSeconds": 6.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 17.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 22.0,
      "frameId": "K0067",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 46.0,
      "frameId": "K0121",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 70.0,
      "frameId": "K0174",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "网格入口",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "提问按钮",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "实时资讯",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "推荐列表",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "手机识图",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "生成图像",
      "end": 36.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36.0,
      "label": "数据分析",
      "end": 46.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46.0,
      "label": "代码调试",
      "end": 58.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 58.0,
      "label": "规划任务",
      "end": 70.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 70.0,
      "label": "像素品牌收尾",
      "end": 76.233333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 76.233333,
  "fontFamily": "Arial, sans-serif"
}
```
