# Underlord｜视频模板

把一次视频编辑请求讲成明确的材料交接：选预设、交视频、确认版式、交品牌指南，最后展示两种比例的结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 35.3,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Create social clips",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#7756f6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Create social clips",
        "accent": "#7756f6"
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

## 素材始终从桌面进入同一个输入框

视频文件和品牌指南在右侧桌面列中保持位置。拖动时文件跟随指针，进入输入区后转为附件；同一个文件名贯穿桌面、输入和确认消息。

```motion-demo
{
  "id": "clip-1",
  "title": "素材始终从桌面进入同一个输入框",
  "src": "demos/clip-1.html",
  "duration": 5,
  "status": "authored",
  "description": "8–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 需要用户决策时才拉近聊天

比例与品牌色选择逐条出现，一次只回答一个问题。窗口局部放大到聊天区，消息正文保持清楚；蓝紫桌面留在四周，帮助观众保持空间方向。

## 处理结束让成品越过窗口

脚本分析与媒体处理后，先出现单个预览，再并列横版和竖版。预览使用相同人物与品牌色，让前面的输入形成可见结果。

| 时间 | 段落 |
|---|---|
| 0.00–2.70s | 桌面与素材 |
| 2.70–5.90s | 选择预设 |
| 5.90–8.00s | 创建项目 |
| 8.00–10.00s | 聚焦聊天 |
| 10.00–13.00s | 拖入视频 |
| 13.00–18.00s | 询问比例 |
| 18.00–21.00s | 输入要求 |
| 21.00–26.00s | 拖入品牌指南 |
| 26.00–29.00s | 确认色彩 |
| 29.00–32.50s | 处理脚本 |
| 32.50–34.00s | 成片预览 |
| 34.00–35.00s | 双比例结果 |
| 35.00–35.30s | 回到起点 |

## 替换材料时保持对话闭环

替换视频、指南文件、比例要求和最终片段，确保输出实际采用前面的选择。可压缩等待时间，但不要省掉关键决策与附件确认。

## 配色与字形

无衬线桌面界面；消息正文和输入内容字号相近，按钮用紫色强调。

#4540d8 · #18151d · #7756f6 · #f1f0f7 · #efc92c

## 元素与制作规则

应用窗口 / 桌面素材 / 预设菜单 / 聊天输入 / 附件 / 处理状态 / 横竖成片

- 把一次视频编辑请求讲成明确的材料交接：选预设、交视频、确认版式、交品牌指南，最后展示两种比例的结果。
- 视频文件和品牌指南在右侧桌面列中保持位置。拖动时文件跟随指针，进入输入区后转为附件；同一个文件名贯穿桌面、输入和确认消息。
- 比例与品牌色选择逐条出现，一次只回答一个问题。窗口局部放大到聊天区，消息正文保持清楚；蓝紫桌面留在四周，帮助观众保持空间方向。

## 内容替换

- 替换视频、指南文件、比例要求和最终片段，确保输出实际采用前面的选择。可压缩等待时间，但不要省掉关键决策与附件确认。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Descript",
  "id": "V378",
  "palette": [
    "#4540d8",
    "#18151d",
    "#7756f6",
    "#f1f0f7",
    "#efc92c"
  ],
  "typography": "无衬线桌面界面；消息正文和输入内容字号相近，按钮用紫色强调",
  "sample": "Create social clips",
  "objects": [
    "应用窗口",
    "桌面素材",
    "预设菜单",
    "聊天输入",
    "附件",
    "处理状态",
    "横竖成片"
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
      "timeSeconds": 5.933333333333334,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 13.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 21.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 32.53333333333333,
      "frameId": "K0078",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/22c284a947709f3e7479a2603af8e060316380be3a0c8978627af0733ea81714",
      "timeSeconds": 35.0,
      "frameId": "K0088",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "桌面与素材",
      "end": 2.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.7,
      "label": "选择预设",
      "end": 5.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.9,
      "label": "创建项目",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "聚焦聊天",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "拖入视频",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "询问比例",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "输入要求",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "拖入品牌指南",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "确认色彩",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "处理脚本",
      "end": 32.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.5,
      "label": "成片预览",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "双比例结果",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "回到起点",
      "end": 35.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 35.3,
  "fontFamily": "Arial, sans-serif"
}
```
