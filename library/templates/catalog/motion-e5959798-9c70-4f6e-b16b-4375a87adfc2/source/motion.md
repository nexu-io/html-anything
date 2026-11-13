# Grok Build｜项目记忆

用记录、浏览、再读取三个具体状态说明项目记忆。左侧一句解释，右侧终端展示这句话对应的变化。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 14.291667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Project memory",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#71b6be"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Project memory",
        "accent": "#71b6be"
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

## 左右两侧分工明确

黑青底纹保持低对比，左侧大字用白色无衬线，右侧终端用等宽字。终端位置与宽度不变，说明文字按阶段替换。

## 三种状态各有可见动作

工作时出现新增记录，浏览时打开记忆列表和正文，后来的会话先读记录再处理相关任务。文件名与核心约定跨阶段保持一致。

| 阶段 | 终端内容 |
| --- | --- |
| 记录 | 任务过程中新增约定 |
| 浏览 | 打开列表并查看同一条约定 |
| 再次使用 | 新会话读入约定后继续任务 |

## 把会话边界讲清楚

浏览结束后用短停顿或终端内容切换建立下一次会话。进入后续任务时，让既有记录先出现，再展开代码或操作。

## 换成其他可积累的知识

可以替换为设计约定、项目术语或团队流程。先写一条具体知识，再安排它在后续任务中的使用方式，避免只滚动无关文字。

## 配色与字形

黑青流体底纹、左说明右暗终端。

#0c1518 · #ffffff · #71b6be · #497d88 · #a0c6cb

## 元素与制作规则

说明标题 / 终端 / MEMORY.md / 记忆列表 / 读取状态

- 以记录→浏览→后来读取三个状态说明跨会话记忆。
- 终端始终在右侧，左侧只换一句解释，减少阅读负担。
- 读取阶段显示对既有记录的引用，不只展示随机代码滚动。

## 内容替换

- 换为可持久化的项目知识工具；保留写入和下次读取的依赖。
- 会话切换是概念边界，不能暗示同一轮对话记忆。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V318",
  "palette": [
    "#0c1518",
    "#ffffff",
    "#71b6be",
    "#497d88",
    "#a0c6cb"
  ],
  "typography": "黑青流体底纹、左说明右暗终端",
  "sample": "Project memory",
  "objects": [
    "说明标题",
    "终端",
    "MEMORY.md",
    "记忆列表",
    "读取状态"
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
      "timeSeconds": 1.8754556500607535,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.035945727014986,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.064702308626975,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/182113461338371d5858ebe90cb1861ae501a1c84bb4765e7746a33183a30696",
      "timeSeconds": 12.989266909680033,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "功能标题",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "工作时记录",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "浏览记忆文件",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "新会话读取",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "可用范围",
      "end": 14.291667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 14.291667,
  "fontFamily": "Arial, sans-serif"
}
```
