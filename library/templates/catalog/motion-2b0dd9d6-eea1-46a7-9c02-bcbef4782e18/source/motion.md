# Computer 能生成交互图表

用统一提问入口串起不同的可交互答案：问题负责设定任务，图表里的具体反馈负责证明答案可以继续探索。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 61.6,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Explore your answers visually",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2c8587"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Explore your answers visually",
        "accent": "#2c8587"
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

## 同一入口，不同答案形态

先用金融问题建立操作方式，再切入科学问题。输入区域的尺寸、对齐和按钮位置保持一致；输出从曲线换成模拟图时，留一段简短主张作为转场。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 主张 |
| 5.00–12.00s | 输入金融问题 |
| 12.00–16.00s | 等待 |
| 16.00–27.00s | 金融曲线 |
| 27.00–32.00s | 交互主张 |
| 32.00–38.00s | 第二次提问 |
| 38.00–43.00s | 三段短句 |
| 43.00–48.00s | 潮汐提问 |
| 48.00–54.00s | 潮汐图解 |
| 54.00–61.60s | 总结与品牌 |

## 曲线响应指针，而不只是出现

曲线先进入，指针随后选择具体位置；提示、读数或辅助线与命中点同步更新。图表坐标和标题固定，反馈只发生在被操作的数据位置。

```motion-demo
{
  "id": "clip-2",
  "title": "曲线响应指针，而不只是出现",
  "src": "demos/clip-2.html",
  "duration": 11,
  "status": "authored",
  "description": "16–27 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 科学图解展示参数如何影响结果

把天体位置、运动关系和说明分层绘制。改变参数后立即更新相关对象，仍保留参照物，使观众能比较前后差异；无关对象不跟着一起移动。

```motion-demo
{
  "id": "clip-3",
  "title": "科学图解展示参数如何影响结果",
  "src": "demos/clip-3.html",
  "duration": 11,
  "status": "authored",
  "description": "43–54 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 保留轻量工具的阅读感

浅暖背景、深色文字和青绿色强调色贯穿两类答案。衬线标题放在主张页，图表轴标与控件使用清楚的无衬线字；主图居中，辅助说明靠近对应数据。

## 把问题与交互成对替换

改主题时先写一个能操作的问题，再选择合适答案形式。趋势用曲线，空间关系用示意图，分类对比用表格；标题、单位、数值和操作反馈须一起更新。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

输入框 / 金融曲线 / 指针提示 / 科学模拟 / 说明标题

- 结果包含可操作图表；指针进入后数据提示响应，不能只让图表整体缩放。
- 三类问题保留统一请求入口，结果视觉类型分别变化。

## 内容替换

- 可替换金融指标和科学主题；必须提供与问题相关的交互反馈。
- 曲线值为示意数据，迁移时不能当原始金融数据使用。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V080",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Explore your answers visually",
  "objects": [
    "输入框",
    "金融曲线",
    "指针提示",
    "科学模拟",
    "说明标题"
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
      "timeSeconds": 12.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 27.0,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 32.0,
      "frameId": "K0077",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 43.0,
      "frameId": "K0099",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 54.0,
      "frameId": "K0118",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "主张",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "输入金融问题",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "等待",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "金融曲线",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "交互主张",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "第二次提问",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "三段短句",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "潮汐提问",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "潮汐图解",
      "end": 54,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54,
      "label": "总结与品牌",
      "end": 61.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 61.6,
  "fontFamily": "Georgia, serif"
}
```
