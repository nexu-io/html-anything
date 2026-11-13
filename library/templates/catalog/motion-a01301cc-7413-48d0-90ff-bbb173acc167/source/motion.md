# ChatGPT — 73 plugins for legal work

把专业工具的能力放进具体工作环节：提出法律任务，展示操作结果，最后汇成合作工具体系。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 60.06,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 15.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "OpenAI for Law",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#3cae74"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "OpenAI for Law",
        "accent": "#3cae74"
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

## 每个工具都有固定的身份位置

白底配粗无衬线标题，文档和表格保持克制的灰阶。当前工具的标识固定在角落，让不同工作环节仍属于同一套演示。

## 用不同成果承接不同任务

检索用对比表，文档处理用正文和标注，资源查找用结果列表，计时用明确的记录条目。每章先说要完成什么，再展开对应成果。

| 工作环节 | 主要呈现 |
| --- | --- |
| 检索对照 | 差异明确的表格 |
| 审阅与修改 | 正文、标记和修改落点 |
| 资源查找 | 条目与当前选中项 |
| 时间记录 | 任务和时间成对出现 |

## 伙伴环放在案例之后

把前面出现的工具缩成图标，围绕中心产品形成环形。中心与外围留出距离，图标数量增加时先缩小整体，不让标识相互碰撞。

```motion-demo
{
  "id": "clip-3",
  "title": "伙伴环放在案例之后",
  "src": "demos/clip-3.html",
  "duration": 10,
  "status": "authored",
  "description": "50–60 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 更换行业时更换案例结构

可改成设计、财务或运营工具集合。保留工具身份、具体任务和成果类型的对应，环形落版只总结前面出现过的合作对象。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 知识能力主张 |
| 5.00–15.00s | 检索与对比表 |
| 15.00–21.00s | 文档处理 |
| 21.00–36.00s | 法律资源 |
| 36.00–50.00s | 计时任务 |
| 50.00–54.00s | 合作伙伴环 |
| 54.00–60.06s | 总主张与落版 |

## 配色与字形

白底粗无衬线标题、插件角标、文档卡与环形图标。

#ffffff · #161916 · #3cae74 · #604795 · #d9e7ee

## 元素与制作规则

主张标题 / 插件角标 / 请求框 / 文档结果 / 合作伙伴环

- 多个插件按主张→操作→证据的重复单元展示；右上角保持当前工具身份。
- 最后插件图标围成环，总结生态覆盖而非单个功能。

## 内容替换

- 换行业时替换插件与对应任务证据，保持章节语法一致。
- 合作伙伴数量可变，但环形中心给主张留空间。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V320",
  "palette": [
    "#ffffff",
    "#161916",
    "#3cae74",
    "#604795",
    "#d9e7ee"
  ],
  "typography": "白底粗无衬线标题、插件角标、文档卡与环形图标",
  "sample": "OpenAI for Law",
  "objects": [
    "主张标题",
    "插件角标",
    "请求框",
    "文档结果",
    "合作伙伴环"
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
      "timeSeconds": 5.005,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 15.015,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 36.036,
      "frameId": "K0082",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 50.050000000000004,
      "frameId": "K0119",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 54.054,
      "frameId": "K0133",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "知识能力主张",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "检索与对比表",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "文档处理",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "法律资源",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "计时任务",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "合作伙伴环",
      "end": 54,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54,
      "label": "总主张与落版",
      "end": 60.06,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 60.06,
  "fontFamily": "Arial, sans-serif"
}
```
