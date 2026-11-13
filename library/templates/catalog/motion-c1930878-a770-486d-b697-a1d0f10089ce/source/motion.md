# Introducing Prime Agent: A self-improving RLM harness for coding and long-running …

让产品机制先通过代码与状态出现，再用任务结果和汇总数字收束。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 44.44,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 16,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "PRIME-AGENT",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#438bc3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "PRIME-AGENT",
        "accent": "#438bc3"
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

## 颗粒背景在后，终端始终可读

深色粒子地形提供空间感，终端使用近黑不透明底。标题、代码与日志使用等宽字，蓝橙语法色限于代码，背景亮度低于正文。

## 机制段一页只解释一种关系

工具调用、记忆改进和代理通信按顺序切换。上方代码与下方状态结构对应，同一子任务名称跨位置保持一致。

```motion-demo
{
  "id": "clip-2",
  "title": "机制段一页只解释一种关系",
  "src": "demos/clip-2.html",
  "duration": 10,
  "status": "authored",
  "description": "10–20 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从单个任务扩大到整体结果

先展示网格任务如何变化，再把多个结果汇成拼图并放大分数，最后转到汇总曲线。数字、任务数量与轴标签需要清楚停留。

| 时间 | 段落 |
|---|---|
| 0.00–1.80s | 黑场 |
| 1.80–5.00s | 产品标题 |
| 5.00–10.00s | 终端标志 |
| 10.00–16.00s | 并行工具调用 |
| 16.00–20.00s | 持续改进 |
| 20.00–23.00s | 代理通信 |
| 23.00–25.00s | 求解请求 |
| 25.00–28.00s | 网格任务 |
| 28.00–35.00s | 成果拼图与分数 |
| 35.00–38.00s | 曲线对照 |
| 38.00–43.00s | 安装命令 |
| 43.00–44.44s | 品牌 |

## 替换任务时连代码与结果一起换

可以迁移到编程、推理或自动化演示。替换请求、代码片段、任务画面和成绩数字，让它们解释同一能力；安装命令留在结束前独立一屏。

## 配色与字形

等宽大写标题、命令与代码；数字结果明显放大。

#080807 · #eee9df · #438bc3 · #b09d7d · #d98442

## 元素与制作规则

颗粒地形 / 终端面板 / 子任务状态 / 网格游戏 / 结果分数 / 曲线图

- 让产品机制先通过代码与状态出现，再用任务结果和汇总数字收束。
- 深色粒子地形提供空间感，终端使用近黑不透明底。标题、代码与日志使用等宽字，蓝橙语法色限于代码，背景亮度低于正文。
- 工具调用、记忆改进和代理通信按顺序切换。上方代码与下方状态结构对应，同一子任务名称跨位置保持一致。

## 内容替换

- 可以迁移到编程、推理或自动化演示。替换请求、代码片段、任务画面和成绩数字，让它们解释同一能力；安装命令留在结束前独立一屏。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Prime Intellect",
  "id": "V203",
  "palette": [
    "#080807",
    "#eee9df",
    "#438bc3",
    "#b09d7d",
    "#d98442"
  ],
  "typography": "等宽大写标题、命令与代码；数字结果明显放大",
  "sample": "PRIME-AGENT",
  "objects": [
    "颗粒地形",
    "终端面板",
    "子任务状态",
    "网格游戏",
    "结果分数",
    "曲线图"
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
      "timeSeconds": 5.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/658c20608945ba63da3ce41991bb3f5560b82d32793a300243e72f46c45a05c5",
      "timeSeconds": 16.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/a7e37e6f9cc45590fa7b64ba38f1520873dc4497e7d71b01177cce477048f800",
      "timeSeconds": 25.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0070",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 43.0,
      "frameId": "K0082",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黑场",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "产品标题",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "终端标志",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "并行工具调用",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "持续改进",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "代理通信",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "求解请求",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "网格任务",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "成果拼图与分数",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "曲线对照",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "安装命令",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "品牌",
      "end": 44.44,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 44.44,
  "fontFamily": "ui-monospace, monospace"
}
```
