# Grok Bot — it can send you voice notes

先约定内容和发送时间，再补充“用语音发给我”。新增的输出形式通过一张可播放的语音卡体现。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 19.233333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Morning voice note",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ec9a60"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Morning voice note",
        "accent": "#ec9a60"
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

## 把两次请求分开显示

橙色光晕衬托白手机，第一条气泡说明日常内容与时间，第二条补充语音形式。无衬线文字保持同一字号，聊天气泡按说话顺序排列。

## 从文字回答长出播放器

确认信息后出现波形卡。播放前保留播放图标和总时长，点击后图标变暂停，颜色从左向右经过波形。

语音总时长与宣传片时长分别设置，进度与播放状态保持一致。

```motion-demo
{
  "id": "clip-2",
  "title": "从文字回答长出播放器",
  "src": "demos/clip-2.html",
  "duration": 10,
  "status": "authored",
  "description": "4–14 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 改成其他多模态交付

可换成课程摘要、团队简报或每日提醒。保留内容请求、格式补充和播放体验三个层次；替换语音时同步更新时长和波形。

## 配色与字形

橙色光晕手机、文字聊天与可播放波形卡。

#fff5eb · #262321 · #ec9a60 · #955aa0 · #d9dddd

## 元素与制作规则

输入栏 / 定时请求 / 格式补充 / 语音卡 / 播放钮 / 波形进度

- 先规定内容和时间，再补充输出形式，结果变成语音卡。
- 点击后播放钮转暂停，进度颜色沿波形推进。
- 示例语音长度不是本视频长度，不把 1:37 当动画时长。

## 内容替换

- 可迁移为其他内容的多模态交付，保留格式变更→产物→播放证据。
- 时间和音频长度独立设置。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V028",
  "palette": [
    "#fff5eb",
    "#262321",
    "#ec9a60",
    "#955aa0",
    "#d9dddd"
  ],
  "typography": "橙色光晕手机、文字聊天与可播放波形卡",
  "sample": "Morning voice note",
  "objects": [
    "输入栏",
    "定时请求",
    "格式补充",
    "语音卡",
    "播放钮",
    "波形进度"
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
      "timeSeconds": 1.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 4.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 11.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 14.0,
      "frameId": "K0046",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "结果预告",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "输入定时请求",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "补充语音格式",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "生成语音卡",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "点击播放",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "进度推进",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "品牌",
      "end": 19.233333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 19.233333,
  "fontFamily": "Arial, sans-serif"
}
```
