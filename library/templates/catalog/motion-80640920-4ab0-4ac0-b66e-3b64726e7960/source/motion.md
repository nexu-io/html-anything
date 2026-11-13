# Figma｜画布中的 Agent

对同一产品连续完成建议、样式应用和内容扩展。协作指针说明多人在场，统一设计系统让变化仍属于一个产品。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 61.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agents on the canvas",
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
        "title": "Agents on the canvas",
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

## 从一个设计帧逐渐扩展

先展示单帧与局部样式，再进入协作、提问和修改。多屏结果在应用设计系统之后出现；增加屏幕时保留共享组件和相同产品名称。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 单帧设计 |
| 6.00–11.00s | 局部样式 |
| 11.00–17.00s | 多人协作 |
| 17.00–22.00s | 提问入口 |
| 22.00–27.00s | 设计建议 |
| 27.00–32.00s | 组件修改 |
| 32.00–38.00s | 应用设计系统 |
| 38.00–43.00s | 成组屏幕 |
| 43.00–49.00s | 新增内容 |
| 49.00–54.00s | 局部扩充 |
| 54.00–59.00s | 主题变体 |
| 59.00–61.00s | 品牌 |

## 协作发生在具体对象上

指针靠近正在讨论的区域，建议与修改组件一一对应。不要让指针在空白处持续游走；当前操作结束后让其停下，把注意力交给变化结果。

## 设计系统决定一组屏幕的变化

应用设计系统时同步调整颜色、文字层级和组件形态。内容扩充后再给主题变体，区分结构变化与皮肤变化；两者都保留同一信息架构。

```motion-demo
{
  "id": "clip-3",
  "title": "设计系统决定一组屏幕的变化",
  "src": "demos/clip-3.html",
  "duration": 27,
  "status": "authored",
  "description": "27–54 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 作品可以鲜艳，编辑框架保持稳定

深底外层承接浅色工作窗口，绿紫橙作为创作与选择强调。标题用中粗无衬线，组件正文用统一的产品字形；多屏排列保持一致间距，避免每个屏幕各自抢占尺度。

## 迁移到新的产品主题

一起更换品牌色、设计内容、组件和应用场景，先完成一屏再扩展成组。协作与建议继续围绕这套产品，不引入无关的演示作品。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

手机设计帧 / 协作指针 / 代理输入 / 设计系统 / 组件 / 主题变体

- 对同一产品连续做建议、样式应用、内容扩充，不能把每次结果当无关作品。
- 协作指针说明多人共用画布，设计系统决定多屏统一性。

## 内容替换

- 换品牌须同时变更颜色、内容与组件，保留同一产品链条。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V248",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Agents on the canvas",
  "objects": [
    "手机设计帧",
    "协作指针",
    "代理输入",
    "设计系统",
    "组件",
    "主题变体"
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
      "timeSeconds": 11.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 22.0,
      "frameId": "K0077",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 38.0,
      "frameId": "K0142",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 49.0,
      "frameId": "K0188",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 59.0,
      "frameId": "K0224",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "单帧设计",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "局部样式",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "多人协作",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "提问入口",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "设计建议",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "组件修改",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "应用设计系统",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "成组屏幕",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "新增内容",
      "end": 49,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 49,
      "label": "局部扩充",
      "end": 54,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54,
      "label": "主题变体",
      "end": 59,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 59,
      "label": "品牌",
      "end": 61.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 61.0,
  "fontFamily": "Arial, sans-serif"
}
```
