# Genspark AI Workspace 3.0: Introducing Genspark Claw

工作流、团队聊天、会议、手机语音和浏览器助手分段出现。统一采用短标题接界面的节奏，切换能力时重新建立场景。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 76.1,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 35,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Genspark AI Workspace 3.0",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#a38ce8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Genspark AI Workspace 3.0",
        "accent": "#a38ce8"
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

## 每项功能先给一句话，再给操作

工作流、团队聊天、会议、手机语音和浏览器助手分段出现。统一采用短标题接界面的节奏，切换能力时重新建立场景。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 品牌与版本 |
| 4.00–18.00s | 工作流 |
| 18.00–29.00s | 团队聊天 |
| 29.00–38.00s | 日历与会议 |
| 38.00–43.00s | 会议摘要 |
| 43.00–59.00s | 手机语音 |
| 59.00–74.00s | 浏览器助手 |
| 74.00–76.10s | 版本收尾 |

## 界面可以倾斜，文字保持水平

桌面与手机以轻微透视旋转进入，重要按钮和输入区再推近。蓝紫环境光始终留在窗口外侧，说明文字保持平直易读。

## 语音输入要看到开始和落字

靠近键盘中的语音按钮，显示监听状态后再出现正文，最后拉回完整手机。替换功能时保留操作状态与结果的先后。

```motion-demo
{
  "id": "clip-3",
  "title": "语音输入要看到开始和落字",
  "src": "demos/clip-3.html",
  "duration": 9,
  "status": "authored",
  "description": "45–54 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 配色与字形

浅蓝紫柔光环境，黑色无衬线标题，产品窗口带柔和投影。。

#edf2f5 · #17191c · #a38ce8 · #bddbf2 · #d5d0e6

## 元素与制作规则

版本标题 / 功能标题 / 桌面窗口 / 日历 / 会议 / 手机键盘 / 浏览器侧栏

- 工作流、团队聊天、会议、手机语音和浏览器助手分段出现。统一采用短标题接界面的节奏，切换能力时重新建立场景。
- 桌面与手机以轻微透视旋转进入，重要按钮和输入区再推近。蓝紫环境光始终留在窗口外侧，说明文字保持平直易读。
- 靠近键盘中的语音按钮，显示监听状态后再出现正文，最后拉回完整手机。替换功能时保留操作状态与结果的先后。

## 内容替换

- 可替换为其他办公套件，保留分功能章节和一条操作因果。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Genspark",
  "id": "V116",
  "palette": [
    "#edf2f5",
    "#17191c",
    "#a38ce8",
    "#bddbf2",
    "#d5d0e6"
  ],
  "typography": "浅蓝紫柔光环境，黑色无衬线标题，产品窗口带柔和投影。",
  "sample": "Genspark AI Workspace 3.0",
  "objects": [
    "版本标题",
    "功能标题",
    "桌面窗口",
    "日历",
    "会议",
    "手机键盘",
    "浏览器侧栏"
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
      "timeSeconds": 3.998248686514886,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 28.987302977232922,
      "frameId": "K0081",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 37.983362521891415,
      "frameId": "K0110",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 58.97416812609457,
      "frameId": "K0165",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 73.9676007005254,
      "frameId": "K0209",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌与版本",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "工作流",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "团队聊天",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "日历与会议",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "会议摘要",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "手机语音",
      "end": 59,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 59,
      "label": "浏览器助手",
      "end": 74,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 74,
      "label": "版本收尾",
      "end": 76.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 76.1,
  "fontFamily": "Arial, sans-serif"
}
```
