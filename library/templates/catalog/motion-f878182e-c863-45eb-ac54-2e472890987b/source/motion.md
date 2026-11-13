# 活动预热｜10 万美元 Make-a-thon

用参与者的回应引出联合活动。双品牌建立关系，周边气泡制造参与感，最后回到简洁的合作落版。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.92,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Make-a-thon",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#96d93c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Make-a-thon",
        "accent": "#96d93c"
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

## 双品牌和参与者各占一层

品牌位于中心，彩色指针与短气泡从周边进入。多人回应可以交错，但不覆盖主标题；黑底、浅色字和绿紫橙参与者标记形成清楚分工。品牌与活动名使用中粗无衬线，气泡使用较小常规字重。

![0.00s · 构图参考](assets/reference-1.jpg)

## 回应聚成活动预告

先让周边回应建立热度，再给活动标签和 Coming soon。预告出现时减少气泡变化，留出阅读停顿；随后创意素材收拢，为双品牌结束页腾出留白。

## 替换合作方与活动信息

两方标志保持相近视觉重量，活动名、预告状态和参与者短句一起更新。双品牌落版使用稳定间距，不因标志宽度差异把其中一方压小；外围素材应与活动类型相关。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

双品牌 / 彩色指针 / 聊天气泡 / 倒计时文案 / 创意素材

- 双品牌居中，参与者气泡从周边入场；集体回应引出活动预告。
- 随后图形从密集拼贴收拢，落到双方标志。

## 内容替换

- 可换联合活动；保留多方参与→活动主张→合作落版。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V103",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Make-a-thon",
  "objects": [
    "双品牌",
    "彩色指针",
    "聊天气泡",
    "倒计时文案",
    "创意素材"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/27772b6bcc0e63489bec0ed78fa7160b05974780e8f0ecf66eef3d797b6314a6",
      "timeSeconds": 10.0,
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "合作品牌",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "协作气泡进入",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "多人回应",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "活动标签",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "Coming soon",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "素材聚合",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "双品牌落版",
      "end": 15.92,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.92,
  "fontFamily": "Arial, sans-serif"
}
```
