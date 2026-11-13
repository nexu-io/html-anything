# Link wallet for agents

先安装并连接 agent，随后用聊天提出行程调整，显示费用，再转到手机确认。费用和商户名称跨界面重复，帮助理解是同一笔请求。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 28.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 19,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Link for agents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#00d96f"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Link for agents",
        "accent": "#00d96f"
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

## 一次付款要把授权过程讲完整

先安装并连接 agent，随后用聊天提出行程调整，显示费用，再转到手机确认。费用和商户名称跨界面重复，帮助理解是同一笔请求。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 安装命令 |
| 3.00–5.80s | 连接日志 |
| 5.80–8.60s | 授权说明 |
| 8.60–15.50s | 聊天与费用汇总 |
| 15.50–18.00s | 手机通知 |
| 18.00–23.00s | 付款授权 |
| 23.00–26.00s | 成功回执 |
| 26.00–28.03s | Link 标志 |

## 深绿处理状态，白卡处理决定

命令和对话停留在细网点深绿底；需要用户操作时切换为白色窄卡片。绿色只用于链接、通知标记和最终成功反馈。

## 通知先出现，再展开审批

手机从背景中浮出，通知在下半部弹入；点击后展成付款授权，再用识别图标和勾表示完成。不要省略确认就直接展示成功。

```motion-demo
{
  "id": "clip-3",
  "title": "通知先出现，再展开审批",
  "src": "demos/clip-3.html",
  "duration": 6.0,
  "status": "authored",
  "description": "15.5–21.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换一笔新的任务

任务、金额、商户与付款方式需在全部阶段同步替换。保留“agent 请求—人确认—完成回执”的动作依赖。

## 配色与字形

深绿终端背景配等宽字；授权页换成白底黑色无衬线。。

#001c11 · #ffffff · #00d96f · #124a31 · #b3d5c8

## 元素与制作规则

命令行 / 授权说明卡 / 费用汇总 / 手机通知 / 支付确认 / 回执

- 先安装并连接 agent，随后用聊天提出行程调整，显示费用，再转到手机确认。费用和商户名称跨界面重复，帮助理解是同一笔请求。
- 命令和对话停留在细网点深绿底；需要用户操作时切换为白色窄卡片。绿色只用于链接、通知标记和最终成功反馈。
- 手机从背景中浮出，通知在下半部弹入；点击后展成付款授权，再用识别图标和勾表示完成。不要省略确认就直接展示成功。

## 内容替换

- 改成其他需要授权的任务，保持请求金额和确认信息一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Stripe",
  "id": "V297",
  "palette": [
    "#001c11",
    "#ffffff",
    "#00d96f",
    "#124a31",
    "#b3d5c8"
  ],
  "typography": "深绿终端背景配等宽字；授权页换成白底黑色无衬线。",
  "sample": "Link for agents",
  "objects": [
    "命令行",
    "授权说明卡",
    "费用汇总",
    "手机通知",
    "支付确认",
    "回执"
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
      "path": "https://r.open-design.ai/files/f59b769967f983ce4594de30f23c9587baf48aeb7e104f371b6895effbf6db78",
      "timeSeconds": 3.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.6,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 15.533333333333333,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 23.0,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/45e041c92686560e2ad39ffee5eac3bf27020fc1753b1689f003ebed872c0835",
      "timeSeconds": 26.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "安装命令",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "连接日志",
      "end": 5.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.8,
      "label": "授权说明",
      "end": 8.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.6,
      "label": "聊天与费用汇总",
      "end": 15.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.5,
      "label": "手机通知",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "付款授权",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "成功回执",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "Link 标志",
      "end": 28.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 28.033333,
  "fontFamily": "ui-monospace, monospace"
}
```
