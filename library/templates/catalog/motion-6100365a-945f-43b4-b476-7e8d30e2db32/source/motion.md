# Reception · 多行业电话接待

先展示多个行业都可能漏接的电话，再让一个助手接住这些需求。前半段制造响应缺口，后半段通过问答给出解决过程。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Reception",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d9763b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Reception",
        "accent": "#d9763b"
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

## 用物件区分场景，用来电统一问题

预约、现场工作与日常事务可以用电话和少量行业物件交代。每个场景保留一个明确的来电状态，标题逐步拼出“没人接听”的共同问题。

白色或浅色空间承托物件，电话屏幕提供深色锚点。句子使用常规无衬线字，关键词略粗，避免每个单词都做不同效果。

## 转折集中到一个助手形象

在转折句之后出现暖色光球或同样简洁的助手符号。由分散物件收束为中心主体，让后面的对话更容易跟随。

## 问答轮流出现，结果具体可读

来电者先提出需求，助手再询问或回应，最后给出预约、记录或处理结果。发言方向、头像或颜色保持一致，前一条消息轻退，新消息保持清晰。

```motion-demo
{
  "id": "clip-3",
  "title": "问答轮流出现，结果具体可读",
  "src": "demos/clip-3.html",
  "duration": 12,
  "status": "authored",
  "description": "16–28 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 适合迁移到哪类服务

选择有真实响应缺口的场景，例如预约、售后或接待。替换行业物件、问题与最终结果，保留多种来电到一个服务入口的收束；结尾功能卡只总结已经展示的能力。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f6f0 · #161616 · #d9763b · #7fb7ae · #d9d6c9

## 元素与制作规则

场景物件 / 电话 / 来电标签 / 问题文字 / 助手光球 / 对话卡 / 功能组

- 前段用多个行业来电建立同一问题；中段单一光球作为解决方案
- 问答卡轮流进入，表示来电者与助手回应而非同时静态堆砌
- 结尾回扣问题并展示行动入口

## 内容替换

- 可迁移为服务响应类故事，保留多需求→响应缺口→代办→结果
- 替换行业、问题和对话内容，保持发言身份清楚

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "ElevenLabs",
  "id": "V060",
  "palette": [
    "#f7f6f0",
    "#161616",
    "#d9763b",
    "#7fb7ae",
    "#d9d6c9"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Reception",
  "objects": [
    "场景物件",
    "电话",
    "来电标签",
    "问题文字",
    "助手光球",
    "对话卡",
    "功能组"
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
      "path": "https://r.open-design.ai/files/41a8f65a3db7014850107d8884ceca3879242d8dd23e50ccd295222c22451db3",
      "timeSeconds": 6.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/1c1e5ddcc678c7413c106cbb82e142b37ab5b4381ee9ae2c99d1f60096951922",
      "timeSeconds": 14.0,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 16.0,
      "frameId": "K0062",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 25.0,
      "frameId": "K0088",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 31.0,
      "frameId": "K0104",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "预约句子与物件",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "来电电话",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "多行业场景",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "无人接听问题",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "Until now",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "助手光球",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "电话对话",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "不漏来电主张",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "功能组",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "网址",
      "end": 32.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.866667,
  "fontFamily": "Arial, sans-serif"
}
```
