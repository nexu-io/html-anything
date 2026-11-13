# Airtable｜用 AI 创建应用

用请求与结果并排的方式展示应用生成，再把附件更新和其他业务案例接进同一语法。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 58.5,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 22,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Create an app",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ca4e25"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Create an app",
        "accent": "#ca4e25"
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

## 左侧提出请求，右侧长出应用

请求发送后右侧先出现布局骨架，再填图表与字段。两侧共享同一任务名称；生成过程改变右侧内容，输入侧栏保持作为起因。

```motion-demo
{
  "id": "clip-1",
  "title": "左侧提出请求，右侧长出应用",
  "src": "demos/clip-1.html",
  "duration": 10,
  "status": "authored",
  "description": "13–23 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 不同业务使用不同结果形态

地图、营销仪表盘、临床反馈表与竞品数据各有自己的布局。每个案例用一套背景色区分，浅色工作面与无衬线文字保持一致。

## 新输入要改变已有应用

附件先进入任务，再出现新增反馈字段与结果。后半成果串联只回顾已建立的能力，不在最后引入长篇新任务。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 桌面实拍 |
| 6.00–11.00s | 地图应用 |
| 11.00–13.00s | 过渡标志 |
| 13.00–17.00s | 营销请求 |
| 17.00–22.00s | 骨架界面 |
| 22.00–25.00s | 仪表盘完成 |
| 25.00–32.00s | 新任务 |
| 32.00–39.00s | 附件输入 |
| 39.00–43.00s | 反馈表 |
| 43.00–48.00s | 竞品查询 |
| 48.00–55.00s | 成果串联 |
| 55.00–58.50s | 品牌 |

## 迁移时替换请求、数据和视图

先确定一种业务对象，再准备字段、图表或地图。输入文案必须能解释右侧产物，装载状态与完成状态使用相同位置，减少无目的跳动。

## 配色与字形

无衬线工具界面；请求气泡和数据表使用常规字重，结果标题加重。

#61a6bd · #172327 · #ca4e25 · #174e3e · #e9e9cf

## 元素与制作规则

输入侧栏 / 应用窗口 / 骨架图表 / 数据表 / 附件 / 成果列

- 用请求与结果并排的方式展示应用生成，再把附件更新和其他业务案例接进同一语法。
- 请求发送后右侧先出现布局骨架，再填图表与字段。两侧共享同一任务名称；生成过程改变右侧内容，输入侧栏保持作为起因。
- 地图、营销仪表盘、临床反馈表与竞品数据各有自己的布局。每个案例用一套背景色区分，浅色工作面与无衬线文字保持一致。

## 内容替换

- 先确定一种业务对象，再准备字段、图表或地图。输入文案必须能解释右侧产物，装载状态与完成状态使用相同位置，减少无目的跳动。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Airtable",
  "id": "V354",
  "palette": [
    "#61a6bd",
    "#172327",
    "#ca4e25",
    "#174e3e",
    "#e9e9cf"
  ],
  "typography": "无衬线工具界面；请求气泡和数据表使用常规字重，结果标题加重",
  "sample": "Create an app",
  "objects": [
    "输入侧栏",
    "应用窗口",
    "骨架图表",
    "数据表",
    "附件",
    "成果列"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/99761822a7fe6a03f283684faa16480da3f0a7bfa9dea1dbb29adfa4dfc9116e",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 11.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 17.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 32.0,
      "frameId": "K0086",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 43.0,
      "frameId": "K0116",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 55.0,
      "frameId": "K0158",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "桌面实拍",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "地图应用",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "过渡标志",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "营销请求",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "骨架界面",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "仪表盘完成",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "新任务",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "附件输入",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "反馈表",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "竞品查询",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "成果串联",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "品牌",
      "end": 58.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 58.5,
  "fontFamily": "Arial, sans-serif"
}
```
