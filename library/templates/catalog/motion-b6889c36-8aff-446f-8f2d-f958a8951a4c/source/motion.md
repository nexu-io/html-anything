# Introducing Muse｜个人 AI 助理发布

用三个生活任务串联助理能力：从消息理解需求，展示正在做什么，再把需要用户决定的环节单独停下来。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 82.541667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 27,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Muse",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#0872c9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Muse",
        "accent": "#0872c9"
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

## 先让任务来自生活消息

浅灰白背景搭配浅蓝对话气泡。头像与状态标签靠近当前任务，输入栏、邮件和表单轮流居中，不同时堆满画面。

## 确认是订单流程里的独立一拍

清单转成订单后再出现允许与拒绝按钮；用户回应之后，状态才推进。按钮与总价同处一张卡，黑字、蓝色主按钮保持清晰层级。

```motion-demo
{
  "id": "clip-2",
  "title": "确认是订单流程里的独立一拍",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "22–29 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 同一助理跨越不同任务

购物、报名、航班分别用清单、表单、行程卡承接。各段之间穿插简短能力句，结束用日程完成与勾选回收，避免每次换任务重新介绍角色。

| 时间 | 段落 |
|---|---|
| 0.00–11.00s | 标志与定位 |
| 11.00–17.00s | 消息入口 |
| 17.00–22.00s | 读取邮件 |
| 22.00–26.00s | 购物清单 |
| 26.00–33.00s | 等待用户确认 |
| 33.00–49.00s | 训练与报名 |
| 49.00–55.00s | 目标提示 |
| 55.00–67.00s | 航班变更 |
| 67.00–72.00s | 日程完成 |
| 72.00–82.54s | 能力收束 |

## 迁移到其他服务

保留消息→信息整理→确认→完成的因果链。更换头像、业务卡和短句时，把付款、报名等决定节点替换为新服务真正需要的用户选择。

## 配色与字形

圆润无衬线正文；短标题居中，消息文字小一档。

#f7f8f8 · #101112 · #0872c9 · #cce7fb · #e7e8e9

## 元素与制作规则

助手头像 / 聊天气泡 / 邮件卡 / 订单确认 / 报名表 / 航班卡 / 日程格

- 浅灰白背景搭配浅蓝对话气泡。头像与状态标签靠近当前任务，输入栏、邮件和表单轮流居中，不同时堆满画面。
- 清单转成订单后再出现允许与拒绝按钮；用户回应之后，状态才推进。按钮与总价同处一张卡，黑字、蓝色主按钮保持清晰层级。
- 购物、报名、航班分别用清单、表单、行程卡承接。各段之间穿插简短能力句，结束用日程完成与勾选回收，避免每次换任务重新介绍角色。
- 保留消息→信息整理→确认→完成的因果链。更换头像、业务卡和短句时，把付款、报名等决定节点替换为新服务真正需要的用户选择。

## 内容替换

- 替换品牌、角色头像与三组相关任务；保留确认再执行。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Meta",
  "id": "V164",
  "palette": [
    "#f7f8f8",
    "#101112",
    "#0872c9",
    "#cce7fb",
    "#e7e8e9"
  ],
  "typography": "圆润无衬线正文；短标题居中，消息文字小一档",
  "sample": "Muse",
  "objects": [
    "助手头像",
    "聊天气泡",
    "邮件卡",
    "订单确认",
    "报名表",
    "航班卡",
    "日程格"
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
      "timeSeconds": 17.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 26.0,
      "frameId": "K0081",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 33.0,
      "frameId": "K0103",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 55.0,
      "frameId": "K0171",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 72.0,
      "frameId": "K0228",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标志与定位",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "消息入口",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "读取邮件",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "购物清单",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "等待用户确认",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "训练与报名",
      "end": 49,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 49,
      "label": "目标提示",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "航班变更",
      "end": 67,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 67,
      "label": "日程完成",
      "end": 72,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 72,
      "label": "能力收束",
      "end": 82.541667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 82.541667,
  "fontFamily": "Arial, sans-serif"
}
```
