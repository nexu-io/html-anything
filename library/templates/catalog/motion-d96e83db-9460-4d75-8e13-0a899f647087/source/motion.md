# Lovable · 从 Slack 发起制作

在同一个聊天线程里呈现多人补充需求、助手交付结果、用户确认下一步。通过消息前后层次引导阅读，不把协作拆成互不相关的屏幕。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 30.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build together.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed3b99"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build together.",
        "accent": "#ed3b99"
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

## 消息是主角，窗口是容器

用温暖到冷色的渐变作为背景，白色消息卡始终保持高对比。发言者、头像和助手标记固定对应，不随卡片换位而改变身份。

消息正文用常规无衬线字，姓名略粗；长消息按自然语意分行。输入与结果卡要比旁侧装饰更醒目。

## 用深度表现会话焦点

新消息进入前景后，旧消息轻微后退、缩小并降低对比。每次只突出正在阅读的一条或一组补充消息，保留足够上下文让观众知道助手在回答谁。

多人意见齐全后再让助手回应。结果先出现，追问随后进入；涉及后续行动时，把用户确认保留为单独一拍。

| 会话节点 | 需要交代的信息 |
| --- | --- |
| 发起请求 | 要做什么 |
| 多人补充 | 补充哪些数据或条件 |
| 助手交付 | 已经产生什么成果 |
| 追问与确认 | 下一步由谁同意 |
| 行动反馈 | 确认后发生了什么 |

## 成果可以换，线程关系要留

可以把反馈仪表盘换成设计方案、活动页面或项目计划，但对应的请求与多人补充也要一起改。结果名称、后续问题与确认动作须互相衔接。

## 配色与字形

无衬线界面文字与清晰大小层级。

#101013 · #ffffff · #ed3b99 · #778df2 · #fb6740

## 元素与制作规则

聊天容器 / 多方消息 / 助手身份 / 仪表盘 / 确认回复

- 消息从不同发言者进入同一线程，助手回应在请求之后
- 旧消息后退并虚化，新消息保持清晰前景，深度表达焦点
- 先展示可用成果，再展示追问与授权，强调协作连续性

## 内容替换

- 迁移保留多方补充→助手合并→成果→确认关系
- 人物头像、业务数据和成果类型可替换，发言者身份须稳定

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Lovable",
  "id": "V041",
  "palette": [
    "#101013",
    "#ffffff",
    "#ed3b99",
    "#778df2",
    "#fb6740"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Build together.",
  "objects": [
    "聊天容器",
    "多方消息",
    "助手身份",
    "仪表盘",
    "确认回复"
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
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 14.0,
      "frameId": "K0054",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 20.0,
      "frameId": "K0069",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 26.0,
      "frameId": "K0088",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "双方品牌",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "聊天窗口",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "发起建站",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "多人补充",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "助手接收",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "成果面板",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "追问",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "名单回复",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "授权执行",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "行动确认",
      "end": 26.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26.0,
      "label": "口号收尾",
      "end": 30.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 30.033333,
  "fontFamily": "Arial, sans-serif"
}
```
