# 用 AI 创建演示文稿

先把主题变成可编辑大纲，再把大纲变成一组完整幻灯片，让两次生成各有清楚结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 21.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 18.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build your presentation",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#cf278c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build your presentation",
        "accent": "#cf278c"
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

## 大纲是第一次生成的交付

输入主题之后先出现章节列表，编辑某个条目时浮层贴近对应行。确认列表后才进入幻灯片生成，章节顺序贯穿到成品。

```motion-demo
{
  "id": "clip-1",
  "title": "大纲是第一次生成的交付",
  "src": "demos/clip-1.html",
  "duration": 7.7,
  "status": "authored",
  "description": "5.8–13.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从骨架变成真实版式

先出现每页内容框，再依次填标题、图表、色块与数字。成品以多格缩略图平铺，保持页面宽高比，避免列表和成品同时抢占画面。

## 暗青舞台与紫红光强调生成

输入和状态用紫红光晕，工作区使用较暗半透明面板。无衬线列表文字保持清楚，幻灯片可引入蓝、橙等内容色；竖版上下排列留出稳定边距。

## 替换主题时同时准备大纲与页内容

选择能用图表、要点和数据页表达的主题，保持章节标题与成品一致。长标题需要换行，不能只缩成难读小字。

## 配色与字形

无衬线输入与列表，成品幻灯片有自己的标题层级；竖版集中排布。

#032329 · #eef3f6 · #cf278c · #3587aa · #2d3148

## 元素与制作规则

提示胶囊 / 大纲条目 / 编辑浮层 / 生成状态 / 幻灯片网格

- 先把主题变成可编辑大纲，再把大纲变成一组完整幻灯片，让两次生成各有清楚结果。
- 输入主题之后先出现章节列表，编辑某个条目时浮层贴近对应行。确认列表后才进入幻灯片生成，章节顺序贯穿到成品。
- 先出现每页内容框，再依次填标题、图表、色块与数字。成品以多格缩略图平铺，保持页面宽高比，避免列表和成品同时抢占画面。

## 内容替换

- 选择能用图表、要点和数据页表达的主题，保持章节标题与成品一致。长标题需要换行，不能只缩成难读小字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Beautiful.ai",
  "id": "V370",
  "palette": [
    "#032329",
    "#eef3f6",
    "#cf278c",
    "#3587aa",
    "#2d3148"
  ],
  "typography": "无衬线输入与列表，成品幻灯片有自己的标题层级；竖版集中排布",
  "sample": "Build your presentation",
  "objects": [
    "提示胶囊",
    "大纲条目",
    "编辑浮层",
    "生成状态",
    "幻灯片网格"
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
      "timeSeconds": 4.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 6.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 13.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 16.0,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 20.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "引入",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "提示输入",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "生成状态",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "大纲列表",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "编辑章节",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "确认大纲",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "版式骨架",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "整套成品",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "停留",
      "end": 21.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 21.033333,
  "fontFamily": "Arial, sans-serif"
}
```
