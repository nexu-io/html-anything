# Cursor Cloud Agents

用“短主张＋短操作”的节奏介绍一组产品更新。每项功能各有自己的对象，统一的是阅读方式，不是界面内容。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 43.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agent UX improvements",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9966cc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Agent UX improvements",
        "accent": "#9966cc"
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

## 黑底一句话，白底一个例子

功能说明置于黑底中央，使用简洁的无衬线字体。句子写完并留出阅读后，再切到浅色操作界面；两种场景的对比自然构成章节边界。

强调色只用于模式标签、当前命令和状态，避免每项功能又换一套装饰。

## 四项功能，四种具体动作

线程订阅展示请求和确认；自定义模式展示标签与后续输入；子代理展示独立工作项；跨轮目标展示目标命令与持续任务。不要让所有章节都变成同一个输入框换文案。

| 更新方向 | 对应操作画面 |
| --- | --- |
| 订阅任务 | 线程请求与后续响应 |
| 自定义模式 | 模式标签和输入 |
| 隔离子代理 | 多个独立任务状态 |
| 持续目标 | 目标命令与后续工作 |

## 结尾只汇总已经讲过的内容

最后用清单回收功能名称，品牌与更新入口随后出现，不再增加第五种尚未示范的功能。

换成其他版本更新时按同样的二拍结构重写，句子可以不同长度，但操作段须留足读懂一次动作的时间。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

黑底说明 / 白底操作 / 线程回复 / 模式标签 / 子代理列表 / 目标命令 / 汇总清单

- 每项功能用黑底一句主张接白底短操作，保持节奏规律
- 不同功能分别需要订阅、模式、并行和目标四种对象，不共用假数据
- 末尾列表重述已展示项，不引入新能力

## 内容替换

- 用于更新日志时每项保留主张→操作证据二拍
- 可以换功能集合，主张必须与随后的真实操作一致

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V260",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Agent UX improvements",
  "objects": [
    "黑底说明",
    "白底操作",
    "线程回复",
    "模式标签",
    "子代理列表",
    "目标命令",
    "汇总清单"
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
      "timeSeconds": 7.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 15.0,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 27.0,
      "frameId": "K0058",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 34.0,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 41.0,
      "frameId": "K0088",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "更新标题",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "订阅任务说明",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "线程订阅",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "自定义模式说明",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "模式输入",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "隔离子代理说明",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "并行任务",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "跨轮目标说明",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "目标命令",
      "end": 34.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34.0,
      "label": "不中断引导说明",
      "end": 38.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38.0,
      "label": "功能汇总",
      "end": 41.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41.0,
      "label": "品牌",
      "end": 43.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 43.866667,
  "fontFamily": "Arial, sans-serif"
}
```
