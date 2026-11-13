# 免费语音输入

标志键帽与文字键帽落下排成一行，再向两边散开，露出发光的黑色声波胶囊。胶囊成为后续演示的共同锚点。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 21.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "VOICE TYPING",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#b5d34a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "VOICE TYPING",
        "accent": "#b5d34a"
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

## 先把键盘动作变成语音状态

标志键帽与文字键帽落下排成一行，再向两边散开，露出发光的黑色声波胶囊。胶囊成为后续演示的共同锚点。

```motion-demo
{
  "id": "clip-1",
  "title": "先把键盘动作变成语音状态",
  "src": "demos/clip-1.html",
  "duration": 4.5,
  "status": "authored",
  "description": "0–4.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 声波跳动的同时文字落进输入区

应用界面从后方出现，声波沿底部流动，输入框内逐步生成句子。保持输入框与录音状态同时可见。

## 收束时让功能名和价格可读

手写 VOICE TYPING 在上，衬线说明 Unlimited words, for free. 在下，胶囊停在底部。最后用整屏酸绿收品牌。

| 时间 | 段落 |
|---|---|
| 0.00–2.50s | 键帽落下 |
| 2.50–5.50s | 变成语音胶囊 |
| 5.50–10.00s | 输入到应用 |
| 10.00–14.50s | 通用应用 |
| 14.50–18.00s | 免费与平台说明 |
| 18.00–21.00s | 绿色品牌页 |

## 配色与字形

米白、酸绿和黑色胶囊，衬线说明搭配手写功能名。。

#f5f5ee · #22251e · #b5d34a · #d8c9e9 · #e1ddd4

## 元素与制作规则

功能键帽 / 录音胶囊 / 动态声波 / 文本输入 / 应用图标 / 品牌

- 标志键帽与文字键帽落下排成一行，再向两边散开，露出发光的黑色声波胶囊。胶囊成为后续演示的共同锚点。
- 应用界面从后方出现，声波沿底部流动，输入框内逐步生成句子。保持输入框与录音状态同时可见。
- 手写 VOICE TYPING 在上，衬线说明 Unlimited words, for free. 在下，胶囊停在底部。最后用整屏酸绿收品牌。

## 内容替换

- 替换语音服务与应用例子，保留按键、录音、落字的逻辑。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Granola",
  "id": "V137",
  "palette": [
    "#f5f5ee",
    "#22251e",
    "#b5d34a",
    "#d8c9e9",
    "#e1ddd4"
  ],
  "typography": "米白、酸绿和黑色胶囊，衬线说明搭配手写功能名。",
  "sample": "VOICE TYPING",
  "objects": [
    "功能键帽",
    "录音胶囊",
    "动态声波",
    "文本输入",
    "应用图标",
    "品牌"
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
      "timeSeconds": 2.466666666666667,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.566666666666666,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 14.8,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "键帽落下",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "变成语音胶囊",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "输入到应用",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "通用应用",
      "end": 14.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.5,
      "label": "免费与平台说明",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "绿色品牌页",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 21.0,
  "fontFamily": "Georgia, serif"
}
```
