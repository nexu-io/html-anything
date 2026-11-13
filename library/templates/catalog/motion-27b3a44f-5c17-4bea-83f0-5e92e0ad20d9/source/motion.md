# Loops 新能力

先枚举几种触发条件，再沿一条环路说明它们能带来什么动作。输入与结果各占一个清楚段落。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 28.466667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Loops",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6970c6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Loops",
        "accent": "#6970c6"
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

## 触发条件快速切，执行动作顺着走

开场标签轮换建立触发范围，进入环路后让光点依次经过查找、私信和通知等动作。近景跟随当前节点，标签在光点到达时获得强调，避免变成无方向的文字巡览。

## 暗色轨道保留足够呼吸空间

黑底、灰色细轨道和冷紫辅助色形成克制的工具气质。节点标签使用清楚的无衬线，光点亮于标签，标签亮于背景刻度；产品名出现时缩减周围信息，给短句留完整阅读区。

## 迁移时成对定义触发与动作

替换标签前，先列触发条件和对应结果。触发可以多种，流程中的动作仍需有顺序；结尾短句总结这套关系，品牌页保持简洁，不再添加新节点。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

触发标签 / 环形轨道 / 动作节点 / 光点 / 总结

- 先快速枚举触发条件，再沿轨道解释输出动作；触发与结果分别占一个段落。
- 近景跟随光点，末尾留白落版。

## 内容替换

- 换流程时保持触发与动作两端，避免混为普通标签巡览。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V110",
  "palette": [
    "#090a0c",
    "#e9e9e8",
    "#6970c6",
    "#30333c",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Loops",
  "objects": [
    "触发标签",
    "环形轨道",
    "动作节点",
    "光点",
    "总结"
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
      "timeSeconds": 6.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 13.0,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 16.0,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 22.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 26.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "多个触发方式",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "环路运行",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "查找关联",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "私信动作",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "通知动作",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "产品名",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "能力短句",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "品牌",
      "end": 28.466667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 28.466667,
  "fontFamily": "Arial, sans-serif"
}
```
