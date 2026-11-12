# Grok Bot can talk now.

让一次讲话最终变成可见的工作成果。语音、处理中和文档各占一个独立状态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 29.666787,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Talk to your bot",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#b187d4"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Talk to your bot",
        "accent": "#b187d4"
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

## 把语音浮层附着在手机上

白色聊天手机置于紫橙光晕中，麦克风、波形和聊天内容共用竖向中心。绿色与紫色区分语音表现，文字使用清楚的无衬线。

## 说完以后，界面进入工作状态

点击麦克风后展开波形；话语结束后收住波形，转为处理中。再次回应时重新恢复语音表现，避免整个过程都在播放同一段波动。

```motion-demo
{
  "id": "clip-2",
  "title": "说完以后，界面进入工作状态",
  "src": "demos/clip-2.html",
  "duration": 22,
  "status": "authored",
  "description": "2–24 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把请求落到文档卡

后段出现明确的文字任务，随后展开对应文档。文档名、版本和任务主题保持关联，让声音引发的变化有具体落点。

## 替换任务与对话

可换成报告、日程或设计交付。先确定用户话语、处理状态和最终产物，再安排波形和字幕的时间关系。

## 配色与字形

白手机、紫绿语音波、外围暖色光晕。

#fffaff · #25202b · #b187d4 · #67b984 · #e9a37c

## 元素与制作规则

手机聊天 / 麦克风 / 语音浮层 / 波形 / 工作中状态 / 文档卡

- 语音浮层附着于手机，回应后落到具体任务和文档。
- 波形、处理中、结果是不同状态，不能持续显示同一个波形。
- 生成的文档名与请求主题对应。

## 内容替换

- 换为其他助手时保留说话→处理→可见产物。
- 声音与实际波形需单独输入；示例波形仅示意。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V027",
  "palette": [
    "#fffaff",
    "#25202b",
    "#b187d4",
    "#67b984",
    "#e9a37c"
  ],
  "typography": "白手机、紫绿语音波、外围暖色光晕",
  "sample": "Talk to your bot",
  "objects": [
    "手机聊天",
    "麦克风",
    "语音浮层",
    "波形",
    "工作中状态",
    "文档卡"
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
      "timeSeconds": 2.0000080898876402,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 15.000060674157304,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 21.000084943820223,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 26.000105168539324,
      "frameId": "K0071",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 28.000113258426964,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "语音入口",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "点击麦克风",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "语音波形",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "处理请求",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "再次回应",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "文字请求",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "文档结果",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "品牌",
      "end": 29.666787,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 29.666787,
  "fontFamily": "Arial, sans-serif"
}
```
