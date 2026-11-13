# Perplexity Projects — hubs for ongoing work

所有文件、任务与对话都属于同一个项目。通过归属和返回关系，把项目空间演成持续工作的地方。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 64.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Projects in Computer",
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
        "title": "Projects in Computer",
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

## 项目是所有内容的父层

项目标题先建立位置，文件和任务从周围进入该范围。父容器的标题、边界或导航至少保留一个；子项移动时不脱离项目归属。

## 从资料汇入到项目内提问

先放入文件，再建立多个任务，最后在项目内部提问。任务切换保留文件上下文，回答不要跳到一个看似全新的空白空间。

| 操作 | 需要保持的关系 |
| --- | --- |
| 文件汇入 | 文件属于当前项目 |
| 并行任务 | 任务引用同一批资料 |
| 项目提问 | 输入与回答保持在项目范围 |
| 团队消息 | 能回到对应项目与产物 |

## 总览负责把分支重新收回

团队消息之后回到项目总览，让观众再次看到文件、任务和成果。总览使用较宽构图，详情使用局部近景；收放变化服务于归属关系。

![50.00s · 构图参考](assets/reference-5.webp)

## 让项目边界轻于内容

浅暖底色、青绿选中态、深色文字即可形成层次。项目主张用衬线字，文件与任务标签用无衬线；边框和连线保持轻量，避免把工作空间画成密集流程图。

## 换内容时先定义项目

可以换成设计冲刺、研究课题或产品发布。先定项目名和共同目标，再填文件、成员与任务；这些内容必须能在同一个总览里归纳。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

项目父容器 / 文件 / 任务行 / 共享输入框 / 团队消息 / 成果

- 文件与多个任务归属于同一项目，任务不是互不相关的漂浮卡片。
- 从项目内提问到团队消息，再回项目总览，证明上下文持续。

## 内容替换

- 换主题保留项目作为父层；替换文件、成员和任务而不丢归属。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V256",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Projects in Computer",
  "objects": [
    "项目父容器",
    "文件",
    "任务行",
    "共享输入框",
    "团队消息",
    "成果"
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
      "path": "https://r.open-design.ai/files/5c47cf3b86ecb180fad3725f9f17d4e0a4040c1d1d54a9f244101202eaf2bcb4",
      "timeSeconds": 11.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 23.0,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 39.0,
      "frameId": "K0090",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 50.0,
      "frameId": "K0106",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 61.0,
      "frameId": "K0136",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "项目标题",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "文件汇入",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "并行任务",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "统一上下文主张",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "项目内提问",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "任务回答",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "跨端主张",
      "end": 44,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44,
      "label": "团队消息",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "项目总览",
      "end": 56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 56,
      "label": "成果回顾",
      "end": 61,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 61,
      "label": "品牌",
      "end": 64.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 64.033333,
  "fontFamily": "Georgia, serif"
}
```
