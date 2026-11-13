# Grok Bot｜Android 发布

用锁屏上的两条通知完成一次问答：人类提出请求，助手带回结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 9.966667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.0,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Grok for Android",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#76ad79"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Grok for Android",
        "accent": "#76ad79"
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

## 锁屏承担整个场景

浅绿背景包围手机，时间与通知层级清楚。白色通知卡使用简洁无衬线，发件人、时间和正文通过字重区分；每条正文控制在两行左右。

## 先推近请求，再出现回复

第一条通知建立事项，第二条通知带出对应结果。镜头靠近通知帮助阅读，随后拉远回到完整手机，再切平台发布短句。

```motion-demo
{
  "id": "clip-2",
  "title": "先推近请求，再出现回复",
  "src": "demos/clip-2.html",
  "duration": 4.7,
  "status": "authored",
  "description": "0.6–5.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换成另一种系统级提醒

可换团队、任务和结果摘要，保留相同事项与先后顺序。结果通知用短句说明已经准备好的东西，品牌信息放在手机之后。

## 配色与字形

浅绿背景、手机锁屏、白色通知。

#c9e6cc · #232a25 · #76ad79 · #ffffff · #e0e5df

## 元素与制作规则

手机锁屏 / 时间 / 请求通知 / 结果通知 / 发布短句

- 先出现人类请求，再出现助手准备好的结果，时间顺序表达回应。
- 推近通知后拉远手机，强调系统级触达。
- 把工作过程压缩为两条通知，直接对照请求和结果。

## 内容替换

- 替换为状态提醒时保留请求→结果通知，避免凭空添加应用内页面。
- 通知摘要短于两行。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V314",
  "palette": [
    "#c9e6cc",
    "#232a25",
    "#76ad79",
    "#ffffff",
    "#e0e5df"
  ],
  "typography": "浅绿背景、手机锁屏、白色通知",
  "sample": "Grok for Android",
  "objects": [
    "手机锁屏",
    "时间",
    "请求通知",
    "结果通知",
    "发布短句"
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
      "timeSeconds": 0.6,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 1.8,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 3.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 5.3,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 8.0,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "手机锁屏",
      "end": 0.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.6,
      "label": "同事请求通知",
      "end": 1.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.7,
      "label": "助手结果通知",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "拉远手机",
      "end": 5.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.3,
      "label": "平台发布短句",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "品牌",
      "end": 9.966667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 9.966667,
  "fontFamily": "Arial, sans-serif"
}
```
