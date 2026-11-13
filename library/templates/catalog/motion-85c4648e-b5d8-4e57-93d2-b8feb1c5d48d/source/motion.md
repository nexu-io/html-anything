# Perplexity Computer — hybrid cloud and local compute

围绕一次任务分流讲混合执行：检查内容，分配到本地或云端，再把结果收回来。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 68.8,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Introducing hybrid",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#438b86"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Introducing hybrid",
        "accent": "#438b86"
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

## 先设置运行方式

用深色画布建立设备、混合设置和任务入口。衬线标题负责解释主张，无衬线界面负责说明选项；青绿色连接与强调态形成主线，次级说明用低对比灰色。

## 检查结果决定走哪条路

提交任务后先出现本地检查，敏感信息提示再进入视线。提示必须先于路径分配；通过高亮对应内容说明检查对象，避免只弹出一条脱离上下文的消息。

```motion-demo
{
  "id": "clip-2",
  "title": "检查结果决定走哪条路",
  "src": "demos/clip-2.html",
  "duration": 18,
  "status": "authored",
  "description": "24–42 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 两处执行，两个进度

本地和云端保持独立位置与状态。任务按职责分流后分别推进，完成时向结果区域汇合；连接线的方向和进度归属始终一致。

| 阶段 | 画面关系 |
| --- | --- |
| 检查 | 任务连接本地检查区 |
| 分流 | 不同内容进入明确的执行节点 |
| 执行 | 每个节点保留自己的状态 |
| 汇总 | 完成项进入共同结果区 |

## 用结果结束技术解释

结果完成后再给本地与云的总结图。保留最重要的两层结构，减少操作细节，让最后的品牌页承接一条已经讲完的任务链。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 主张 |
| 7.00–13.00s | 设备示意 |
| 13.00–24.00s | 混合设置 |
| 24.00–30.00s | 提交任务 |
| 30.00–36.00s | 本地检查 |
| 36.00–42.00s | 敏感数据提示 |
| 42.00–48.00s | 隐私主张 |
| 48.00–54.00s | 双路执行 |
| 54.00–60.00s | 结果 |
| 60.00–65.00s | 本地与云总结 |
| 65.00–68.80s | 品牌 |

## 换数据类型，保留判断条件

改成其他业务时，先定义检查内容和分流规则，再改提示、节点名称与结果文案。复杂度来自真实的两种处理方式，不靠增加无关节点。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#111611 · #f0eee6 · #438b86 · #516166 · #ffffff

## 元素与制作规则

本地节点 / 云节点 / 任务输入 / 敏感信息提示 / 并行状态 / 结果

- 先检查敏感信息，再决定本地或云端路径，两个运行位置有明确职责。
- 进度条分别属于各执行节点，不能合成一条无法辨认的加载。

## 内容替换

- 迁移时保留检查→分流→汇总；替换数据类型及节点名称。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V263",
  "palette": [
    "#111611",
    "#f0eee6",
    "#438b86",
    "#516166",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Introducing hybrid",
  "objects": [
    "本地节点",
    "云节点",
    "任务输入",
    "敏感信息提示",
    "并行状态",
    "结果"
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
      "timeSeconds": 13.0,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 30.0,
      "frameId": "K0073",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 42.0,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 54.0,
      "frameId": "K0113",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 65.0,
      "frameId": "K0138",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "主张",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "设备示意",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "混合设置",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "提交任务",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "本地检查",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "敏感数据提示",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "隐私主张",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "双路执行",
      "end": 54,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54,
      "label": "结果",
      "end": 60,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 60,
      "label": "本地与云总结",
      "end": 65,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 65,
      "label": "品牌",
      "end": 68.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 68.8,
  "fontFamily": "Georgia, serif"
}
```
