# Goodfire — Understand and debug your AI model

把模型检查做成可跟随的研究过程：先明确对象和数据集，再确认检查计划，最后给出发现及下一步实验。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 39.4,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 27,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Goodfire",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#94714c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Goodfire",
        "accent": "#94714c"
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

## 输入同时说明任务与对象

奶油色纸面上放一句衬线提问，用户输入检查目标并附模型路径。回答后将模型表现为棕色层叠结构，层数与名称贴近对象。

## 启动前留出数据与计划确认

数据集卡先出现，用户确认后再列检查清单。七项检查对齐成列，启动按钮靠近清单底部；不要越过确认直接播放结果。

```motion-demo
{
  "id": "clip-2",
  "title": "启动前留出数据与计划确认",
  "src": "demos/clip-2.html",
  "duration": 8,
  "status": "authored",
  "description": "16–24 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 运行状态留在同一列表里

待执行、进行中与完成依次替换，进度条只作用于当前项目。完成后把发现展开为图与短结论，不在整个页面同时跳出多个警告。

```motion-demo
{
  "id": "clip-3",
  "title": "运行状态留在同一列表里",
  "src": "demos/clip-3.html",
  "duration": 8,
  "status": "authored",
  "description": "25–33 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结论连接下一次实验

用一个主要发现、一段解释和一个后续操作收尾。更换科学任务时重写数据集、检查项与发现，不把演示数值当作真实评估结论。

## 配色与字形

衬线标题与正文带研究笔记感；状态、路径与数字用小号等宽。

#eee9dc · #352a20 · #94714c · #d7cbb5 · #7c9278

## 元素与制作规则

需求输入 / 模型附件 / 层叠结构 / 数据集卡 / 检查清单 / 进度条 / 发现图 / 后续按钮

- 奶油色纸面上放一句衬线提问，用户输入检查目标并附模型路径。回答后将模型表现为棕色层叠结构，层数与名称贴近对象。
- 数据集卡先出现，用户确认后再列检查清单。七项检查对齐成列，启动按钮靠近清单底部；不要越过确认直接播放结果。
- 待执行、进行中与完成依次替换，进度条只作用于当前项目。完成后把发现展开为图与短结论，不在整个页面同时跳出多个警告。
- 用一个主要发现、一段解释和一个后续操作收尾。更换科学任务时重写数据集、检查项与发现，不把演示数值当作真实评估结论。

## 内容替换

- 替换模型、数据集、检查项和后续实验；保留确认与检查的顺序。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Goodfire",
  "id": "V189",
  "palette": [
    "#eee9dc",
    "#352a20",
    "#94714c",
    "#d7cbb5",
    "#7c9278"
  ],
  "typography": "衬线标题与正文带研究笔记感；状态、路径与数字用小号等宽",
  "sample": "Goodfire",
  "objects": [
    "需求输入",
    "模型附件",
    "层叠结构",
    "数据集卡",
    "检查清单",
    "进度条",
    "发现图",
    "后续按钮"
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
      "timeSeconds": 10.0,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 20.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 22.566666666666666,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 31.0,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 39.0,
      "frameId": "K0080",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "提出任务",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "附加模型",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "模型结构",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "选择数据集",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "规划检查",
      "end": 22.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.5,
      "label": "启动运行",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "进度反馈",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "查看发现",
      "end": 37,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37,
      "label": "后续实验",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "品牌",
      "end": 39.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 39.4,
  "fontFamily": "Georgia, serif"
}
```
