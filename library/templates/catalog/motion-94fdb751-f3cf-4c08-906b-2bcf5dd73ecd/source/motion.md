# Gmail × Gemini

把邮件助手分成几个可独立理解的任务：整理重要事项、起草、回复和查找。每章都让操作回应具体邮件。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 71.233333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Gemini in Gmail",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#5688e5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Gemini in Gmail",
        "accent": "#5688e5"
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

## 先给完整收件箱，再推近当前任务

浅蓝白界面中，侧栏、邮件列表和正文保持固定关系。用无衬线区分标题、发件人和摘要，彩色星形只承担入口与品牌强调。

## 重要事项要能走到下一步

从全局收件箱进入优先列表，再展开摘要和可执行按钮。邮件主题在列表、摘要和按钮后的结果中持续对应。

```motion-demo
{
  "id": "clip-2",
  "title": "重要事项要能走到下一步",
  "src": "demos/clip-2.html",
  "duration": 21,
  "status": "authored",
  "description": "5–26 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 写作和回复保留不同上下文

起草时先呈现需要说明的事项和相关材料，再出现完整邮件。回复时保留来信，让建议文本贴近对话，发送动作放在内容可读之后。

![43.00s · 构图参考](assets/reference-4.webp)

## 查找章节改用问题带路

把输入框放大，输入一条自然语言问题，再展示从邮件中得到的答案。移动端收尾压缩界面，只保留问题、主要答案和一个后续动作。

## 按任务安排镜头长度

完整界面用于定位，局部按钮用于操作，正文用于阅读。较长邮件段用摘要代表，不让密集文字占据所有镜头。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 品牌星形 |
| 5.00–10.00s | 邮件全局 |
| 10.00–18.00s | 重要事项列表 |
| 18.00–26.00s | 可执行建议 |
| 26.00–43.00s | 起草邮件 |
| 43.00–52.00s | 回复建议 |
| 52.00–60.00s | 用自然语言查邮件 |
| 60.00–67.00s | 移动端答案 |
| 67.00–71.23s | 品牌收尾 |

## 为另一类收件箱准备内容

可换工单、审批或团队消息。每章准备同一事项的输入、操作和输出；更换主题时连发件人、摘要和结果一起替换。

## 配色与字形

浅蓝白邮件界面、彩色星形、局部倾斜和推近。

#f7f9fc · #202633 · #5688e5 · #cce3f8 · #e4675d

## 元素与制作规则

邮件侧栏 / 待办列表 / 摘要卡 / 撰写窗口 / 回复建议 / 搜索框 / 手机结果

- 每章按邮件上下文→操作→结果推进，保留主题和收件人连续性。
- 先给完整界面，再推近当前按钮或文本；未操作区域弱化。
- 优先级、写作、回复、检索是不同章节，不能混成一个长聊天。

## 内容替换

- 可迁移为工作收件箱，换任务与内容，保留有上下文的操作链。
- 新主题必须提供每章的问题、动作、结果三件套。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V235",
  "palette": [
    "#f7f9fc",
    "#202633",
    "#5688e5",
    "#cce3f8",
    "#e4675d"
  ],
  "typography": "浅蓝白邮件界面、彩色星形、局部倾斜和推近",
  "sample": "Gemini in Gmail",
  "objects": [
    "邮件侧栏",
    "待办列表",
    "摘要卡",
    "撰写窗口",
    "回复建议",
    "搜索框",
    "手机结果"
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
      "timeSeconds": 10.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 18.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 43.0,
      "frameId": "K0099",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 52.0,
      "frameId": "K0118",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 67.0,
      "frameId": "K0155",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌星形",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "邮件全局",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "重要事项列表",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "可执行建议",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "起草邮件",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "回复建议",
      "end": 52,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 52,
      "label": "用自然语言查邮件",
      "end": 60,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 60,
      "label": "移动端答案",
      "end": 67,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 67,
      "label": "品牌收尾",
      "end": 71.233333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 71.233333,
  "fontFamily": "Arial, sans-serif"
}
```
