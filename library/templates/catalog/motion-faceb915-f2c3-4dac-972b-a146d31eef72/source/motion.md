# Perplexity Computer 能完全本地跑在 Mac 上

先交代任务在哪里运行，再展示它完成了什么。报告、待办和本地应用联动依次扩展“本地执行”的含义。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 68.516667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 14,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Run tasks locally",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#45a8ab"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Run tasks locally",
        "accent": "#45a8ab"
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

## 运行位置先于任务输入

开场先给本地选项和设备状态，使用深色界面与青色细线强调当前选择。标题使用衬线字，设置与文件信息用无衬线字；把设备标识放在输入附近，后续仍可找到。

![14.00s · 构图参考](assets/reference-2.jpg)

## 用不同产物推进演示

第一段以文档分析和报告建立完整流程，第二段换成待办与应用联动。界面中保留相同任务入口，通过结果类型的变化展示能力范围。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 本地主张 |
| 5.00–14.00s | 本地模型设置 |
| 14.00–20.00s | 读取任务 |
| 20.00–28.00s | 提交需求 |
| 28.00–36.00s | 处理文档 |
| 36.00–42.00s | 分析结果 |
| 42.00–48.00s | 第二个任务 |
| 48.00–53.00s | 本地设备状态 |
| 53.00–59.00s | 待办结果 |
| 59.00–64.00s | 应用联动 |
| 64.00–68.52s | 品牌 |

## 提交、处理、结果依次接力

需求提交后才出现文件处理状态，报告完成后再展开正文。聚焦框跟随正在执行的区域，细光边在状态切换时短暂出现；任务稳定后取消持续闪烁。

```motion-demo
{
  "id": "clip-3",
  "title": "提交、处理、结果依次接力",
  "src": "demos/clip-3.html",
  "duration": 22,
  "status": "authored",
  "description": "20–42 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 迁移到另一套本地工具

选择同一工作场景中的输入文件、报告和后续操作。例如设计文件可以接设计检查与待办，工程文件可以接构建结果与本地工具；保持“设备选择→任务→可用产物”的闭环。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#121511 · #f0f1e9 · #45a8ab · #253b3b · #ffffff

## 元素与制作规则

本地选项 / 输入框 / 运行状态 / 报告 / 待办列表 / 本地应用

- 先展示运行位置再执行任务，用结果报告和待办列表证明本地操作。
- 细光边用于聚焦输入与设备状态，不应全程闪烁。

## 内容替换

- 可换本地工具与输入文件；保留运行位置→任务→本地结果关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V081",
  "palette": [
    "#121511",
    "#f0f1e9",
    "#45a8ab",
    "#253b3b",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Run tasks locally",
  "objects": [
    "本地选项",
    "输入框",
    "运行状态",
    "报告",
    "待办列表",
    "本地应用"
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
      "timeSeconds": 14.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 28.0,
      "frameId": "K0065",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 42.0,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 53.0,
      "frameId": "K0120",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 64.0,
      "frameId": "K0146",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "本地主张",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "本地模型设置",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "读取任务",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "提交需求",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "处理文档",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "分析结果",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "第二个任务",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "本地设备状态",
      "end": 53,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 53,
      "label": "待办结果",
      "end": 59,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 59,
      "label": "应用联动",
      "end": 64,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 64,
      "label": "品牌",
      "end": 68.516667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 68.516667,
  "fontFamily": "Georgia, serif"
}
```
