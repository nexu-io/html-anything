# Notion as code — workspaces in TypeScript

从终端需求走到可用工作区。代码是中间产物，最后必须让观众看到它生成的实际页面。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 51.06684,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 17,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Notion as code",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Notion as code",
        "accent": "#2f91cb"
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

## 先输入目标，再展示执行

发布标题后进入终端，用一段简洁需求说明要创建什么。文字按输入节奏出现，计划与约束随后展开，执行日志不要抢在需求之前。

```motion-demo
{
  "id": "clip-1",
  "title": "先输入目标，再展示执行",
  "src": "demos/clip-1.html",
  "duration": 26,
  "status": "authored",
  "description": "4–30 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 代码后面接部署与工作区

代码输出之后给一次明确的部署确认，再切到浅色工作区成果。工作区标题和结构要对应开头请求，让黑底命令变成可以直接理解的结果。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 发布标题 |
| 4.00–17.00s | 终端输入 |
| 17.00–23.00s | 代理执行 |
| 23.00–30.00s | 计划与约束 |
| 30.00–36.00s | 代码输出 |
| 36.00–40.00s | 部署确认 |
| 40.00–48.00s | 工作区成果 |
| 48.00–51.07s | 品牌 |

## 黑白两种工作面承担阶段变化

终端用深底与等宽字，结果用白底和无衬线界面。标题采用中粗无衬线，外围淡色背景保持克制；指针、日志重点和完成状态共用一条强调色。

## 围绕一种可见结果改写

更换生成目标时，一起替换提示词、计划、关键代码和最终页面。代码镜头只保留足以解释结构的内容，把片长留给结果展示。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

终端窗口 / 提示词 / 计划清单 / 代码 / 部署命令 / 工作区

- 先写需求再展示执行与代码，部署确认后切到真实工作区成果。
- 终端黑底与结果白底形成阶段区分。

## 内容替换

- 可换生成目标；保留命令→生成→部署→可见成果。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V303",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Notion as code",
  "objects": [
    "终端窗口",
    "提示词",
    "计划清单",
    "代码",
    "部署命令",
    "工作区"
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
      "timeSeconds": 4.000013598781549,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 23.000078192993907,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 30.00010199086162,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 40.00013598781549,
      "frameId": "K0085",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 48.00016318537859,
      "frameId": "K0100",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "发布标题",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "终端输入",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "代理执行",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "计划与约束",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "代码输出",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "部署确认",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "工作区成果",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "品牌",
      "end": 51.06684,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 51.06684,
  "fontFamily": "Arial, sans-serif"
}
```
