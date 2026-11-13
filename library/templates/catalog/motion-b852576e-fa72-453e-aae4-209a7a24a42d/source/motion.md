# Introducing Loops

把工作流画成闭合轨道。光点逐个激活动作节点，多个环路再组成系统，最后收束为产品标志。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 40.45,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
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

## 先看一个动作，再看完整闭环

开头贴近触发、上下文和评审节点，光点经过时才激活对应标签。随后拉开视野，让这些动作落在同一条闭合路径上；顺序沿轨道方向保持一致。

```motion-demo
{
  "id": "clip-1",
  "title": "先看一个动作，再看完整闭环",
  "src": "demos/clip-1.html",
  "duration": 18,
  "status": "authored",
  "description": "0–18 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 多环展开之后再交织收束

多个任务环保持各自中心与节点，展开时让观众分辨它们是不同流程。交织段逐步降低标签密度，保留环形运动，最后过渡到抽象标志和产品名。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 触发节点 |
| 4.00–8.00s | 查找上下文 |
| 8.00–12.00s | 评审节点 |
| 12.00–18.00s | 环路全景 |
| 18.00–24.00s | 多个任务环 |
| 24.00–29.00s | 环路交织 |
| 29.00–32.00s | 抽象标志 |
| 32.00–38.00s | 产品名 |
| 38.00–40.45s | 品牌 |

## 细线、微光和大面积黑色

用接近黑色的背景、灰色刻度、少量冷紫与白色光点。标签用小号无衬线，产品名用中等字重的大字；光晕只围绕当前节点，轨道比活动光点暗，保证前后层次。

## 先写流程顺序，再换节点名称

可换成发布、审批或内容生产流程。每个节点对应真实动作，终点能回到下一轮触发；品牌落版可以换标志，但应与环路的聚合方式有视觉联系。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#090a0c · #e9e9e8 · #6970c6 · #30333c · #ffffff

## 元素与制作规则

环形路径 / 动作节点 / 高亮行进点 / 刻度 / 标签 / 交织环

- 发光点沿环路依次激活动作标签，完整闭环对应一条工作流。
- 多环并置形成系统视角，最后收敛为产品标志。

## 内容替换

- 可换工作流步骤，保留触发→处理→结果的闭环。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V109",
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
    "环形路径",
    "动作节点",
    "高亮行进点",
    "刻度",
    "标签",
    "交织环"
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
      "timeSeconds": 8.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.0,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 24.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 29.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 38.0,
      "frameId": "K0066",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "触发节点",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "查找上下文",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "评审节点",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "环路全景",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "多个任务环",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "环路交织",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "抽象标志",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "产品名",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "品牌",
      "end": 40.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 40.45,
  "fontFamily": "Arial, sans-serif"
}
```
