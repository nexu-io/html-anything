# ChatGPT Desktop — now in preview on Linux

沿用一个代码任务，把它整理成可分享的文档，再打开到日常使用的编辑器中。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 45.253542,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "ChatGPT Desktop on Linux",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#5575db"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "ChatGPT Desktop on Linux",
        "accent": "#5575db"
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

## 保留任务的名字和材料

白色工作台上固定会话侧栏，代码区使用等宽字，蓝紫色只点亮当前操作。代码文件名、文档标题和正文内容围绕同一任务。

## 从代码视图切到文档请求

代码结果稳定后，再提出“整理成文档”的请求。新文档在旁边展开，让观众同时看到素材和成果的关系。

```motion-demo
{
  "id": "clip-2",
  "title": "从代码视图切到文档请求",
  "src": "demos/clip-2.html",
  "duration": 22,
  "status": "authored",
  "description": "6–28 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 在目标编辑器里结束

打开文档后保留编辑器工具栏，呈现标题、代码段和说明正文。成品能被继续编辑，是这一段的落点。

## 替换成另一种知识成果

可换成调研、会议纪要或设计说明。保留素材、整理请求、目标文件三者的对应；文档内容变长时展示有代表性的开头和一个重点段落。

## 配色与字形

白色工作区、蓝紫桌面边缘、等宽代码与文档。

#fbfbfb · #20241f · #5575db · #ecf1e5 · #829bce

## 元素与制作规则

会话侧栏 / 输入 / 代码差异 / 回复 / 文档链接 / 文档窗口

- 先展示代码任务，再要求将代码整理成文档；打开结果验证跨应用交付。
- 镜头在会话、代码和文档三个区域切换，始终维持同一任务上下文。

## 内容替换

- 可迁移成设计稿→说明文档；保留生成后打开核验。
- 内容可替换，来源与交付文件应对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V304",
  "palette": [
    "#fbfbfb",
    "#20241f",
    "#5575db",
    "#ecf1e5",
    "#829bce"
  ],
  "typography": "白色工作区、蓝紫桌面边缘、等宽代码与文档",
  "sample": "ChatGPT Desktop on Linux",
  "objects": [
    "会话侧栏",
    "输入",
    "代码差异",
    "回复",
    "文档链接",
    "文档窗口"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/0656e3b165acd6e85daebd99fc8ce4496bfc148431255f3d01a2a9adc6eab1ba",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 3.0029999999999997,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 6.005999999999999,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 22.022,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 28.028,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 40.04,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "Linux 预告",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "工作区输入",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "代码与回复并列",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "请求生成文档",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "文档生成结果",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "打开文档核验",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "品牌落版",
      "end": 45.253542,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 45.253542,
  "fontFamily": "ui-monospace, monospace"
}
```
