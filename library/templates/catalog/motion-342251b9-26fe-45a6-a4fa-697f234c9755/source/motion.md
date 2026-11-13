# Devin Desktop 改版

每段先显示完整窗口，再推近当前区域：会话树、终端、设备测试、规则设置与 PR。字幕固定在画面下方说明这一段的操作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 15,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Devin Desktop",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#65a58e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Devin Desktop",
        "accent": "#65a58e"
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

## 围绕功能把界面拉近再拉远

每段先显示完整窗口，再推近当前区域：会话树、终端、设备测试、规则设置与 PR。字幕固定在画面下方说明这一段的操作。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 窗口建立 |
| 3.00–8.50s | 组织会话 |
| 8.50–13.00s | 打开终端 |
| 13.00–18.00s | 设备测试 |
| 18.00–23.00s | 规则与技能 |
| 23.00–29.00s | PR 合并 |
| 29.00–32.00s | 品牌 |

## 状态变化必须发生在当前焦点

拖动会话后看层级变化，运行命令后看终端文本，点击合并后看成功反馈。其他区域降低对比，操作与结果不要分散到不同窗口。

```motion-demo
{
  "id": "clip-2",
  "title": "状态变化必须发生在当前焦点",
  "src": "demos/clip-2.html",
  "duration": 5,
  "status": "authored",
  "description": "23–28 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 界面保持实用而克制

白面板与浅灰分隔承担主要层级，浅绿只用于成功行或状态。换工具时替换具体面板与操作，仍保留每段一个动作与一个结果。

## 配色与字形

白色产品窗口为主，黑字功能字幕在下方，成功反馈使用浅绿色。。

#fafafa · #202022 · #65a58e · #dedee2 · #8c8c93

## 元素与制作规则

会话树 / 终端 / 设备画面 / 规则编辑 / PR diff / 功能字幕

- 每段先显示完整窗口，再推近当前区域：会话树、终端、设备测试、规则设置与 PR。字幕固定在画面下方说明这一段的操作。
- 拖动会话后看层级变化，运行命令后看终端文本，点击合并后看成功反馈。其他区域降低对比，操作与结果不要分散到不同窗口。
- 白面板与浅灰分隔承担主要层级，浅绿只用于成功行或状态。换工具时替换具体面板与操作，仍保留每段一个动作与一个结果。

## 内容替换

- 替换开发工具流程，保持功能字幕、界面焦点和结果一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cognition",
  "id": "V150",
  "palette": [
    "#fafafa",
    "#202022",
    "#65a58e",
    "#dedee2",
    "#8c8c93"
  ],
  "typography": "白色产品窗口为主，黑字功能字幕在下方，成功反馈使用浅绿色。",
  "sample": "Devin Desktop",
  "objects": [
    "会话树",
    "终端",
    "设备画面",
    "规则编辑",
    "PR diff",
    "功能字幕"
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
      "timeSeconds": 3.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.5,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/2efa824ab384f4edd4fede8dd83de88dbff13a0c8cf7a1bc592cfbcdbd3e213b",
      "timeSeconds": 18.0,
      "frameId": "K0058",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 23.0,
      "frameId": "K0067",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 29.0,
      "frameId": "K0079",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "窗口建立",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "组织会话",
      "end": 8.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.5,
      "label": "打开终端",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "设备测试",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "规则与技能",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "PR 合并",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.0,
  "fontFamily": "Arial, sans-serif"
}
```
