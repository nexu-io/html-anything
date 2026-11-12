# Figma Code Layers

代码生成的界面进入设计画布，经过协作与比较，再更新回同一个代码层。把实现和设计演成可往返的工作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 34.833333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Bring code to the canvas",
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
        "title": "Bring code to the canvas",
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

## 代码层进入画布后保持身份

输入之后让代码生成的界面成为可选择对象，与其他设计变体并排。标题、边框或图层名称持续可见，更新时不要换成一张没有来路的新画面。

```motion-demo
{
  "id": "clip-1",
  "title": "代码层进入画布后保持身份",
  "src": "demos/clip-1.html",
  "duration": 9,
  "status": "authored",
  "description": "4–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 先比较变体，再更新选中结果

协作指针进入后展开多帧探索，选择一个结果，再执行更新。更新完成后展示多场景应用，说明这次变化已进入同一套产品。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 主张 |
| 4.00–7.00s | MCP 输入 |
| 7.00–10.00s | 代码层进入 |
| 10.00–13.00s | 协作指针 |
| 13.00–18.00s | 多帧探索 |
| 18.00–22.00s | 选择结果 |
| 22.00–27.00s | 更新代码层 |
| 27.00–31.00s | 多场景结果 |
| 31.00–33.00s | 总结 |
| 33.00–34.83s | 品牌 |

## 工具框架轻，选择反馈清楚

深底外层承接浅色画布，无衬线标题与细界面文字分层。绿紫橙可以服务不同变体，但选中边框保持同一种视觉语言；屏幕并置时统一基线和间距。

## 迁移到其他原型流程

更换代码入口、画布工具和产品内容。保留“导入实现→画布比较→选择→更新实现”的闭环，指针和更新动作始终落在具体对象上。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

代码层 / 设计画布 / 协作指针 / 版本变体 / 更新按钮

- 代码生成的界面作为画布对象，与设计变体并置比较；更新后仍是同一代码层。
- 多人光标先出现，再对局部结果操作。

## 内容替换

- 可迁移原型工具；保留代码↔设计的迭代关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V276",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Bring code to the canvas",
  "objects": [
    "代码层",
    "设计画布",
    "协作指针",
    "版本变体",
    "更新按钮"
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
      "timeSeconds": 7.0,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0047",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0067",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/4912812d14b4582fc04e46c19550a1341db4c6990bd2cf9cc39e66085e9ad21e",
      "timeSeconds": 27.0,
      "frameId": "K0099",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 33.0,
      "frameId": "K0120",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "主张",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "MCP 输入",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "代码层进入",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "协作指针",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "多帧探索",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "选择结果",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "更新代码层",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "多场景结果",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "总结",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "品牌",
      "end": 34.833333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 34.833333,
  "fontFamily": "Arial, sans-serif"
}
```
