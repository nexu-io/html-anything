# Introducing Glean

先展示助理理解个人任务，再把个人偏好扩展为人员、项目和数据的企业关系图。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 91.933333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 49,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Glean Assistant",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6c22c8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Glean Assistant",
        "accent": "#6c22c8"
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

## 个人任务用结果说明理解

粉紫与米白渐变背景上保留细网格。提示栏输入后扩成白色结果卡，让策划方案或团队更新占据主要阅读时间，标题只在任务切换时出现。

## 人物中心转成企业图谱

先以单个人物为圆心放置写作、思考等偏好，再拉远加入人员、项目、数据与任务节点。连线随节点入场生长，近景文字清楚后再缩小成整体。

```motion-demo
{
  "id": "clip-2",
  "title": "人物中心转成企业图谱",
  "src": "demos/clip-2.html",
  "duration": 20,
  "status": "authored",
  "description": "35–55 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 图谱回到可使用的代理

网络解释上下文，下一段仍要回到提示栏、流程和工具入口。将复杂图谱与简洁任务界面交替，不让所有镜头都变成漫游关系图。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 柔和几何品牌 |
| 6.00–14.00s | 个人助理 |
| 14.00–20.00s | 任务输入 |
| 20.00–27.00s | 策划结果 |
| 27.00–35.00s | 个人写作 |
| 35.00–45.00s | 个人偏好图 |
| 45.00–58.00s | 企业关系图 |
| 58.00–69.00s | 创建代理 |
| 69.00–74.00s | 代理流程 |
| 74.00–79.00s | 工具生态 |
| 79.00–91.93s | 企业网络收束 |

## 把新行业的关系填进去

替换人物、项目和数据源时，按真实关联连线。个人写作习惯与组织资源分别保留一个示例，结果文本只需展示最关键段落。

## 配色与字形

中等字重无衬线；紫色陈述句与白色结果卡分层。

#f7f2e7 · #35223b · #6c22c8 · #e8c4ef · #d4ef90

## 元素与制作规则

柔和曲面 / 提示栏 / 结果文本 / 人物节点 / 项目节点 / 工具图标 / 网络连线

- 粉紫与米白渐变背景上保留细网格。提示栏输入后扩成白色结果卡，让策划方案或团队更新占据主要阅读时间，标题只在任务切换时出现。
- 先以单个人物为圆心放置写作、思考等偏好，再拉远加入人员、项目、数据与任务节点。连线随节点入场生长，近景文字清楚后再缩小成整体。
- 网络解释上下文，下一段仍要回到提示栏、流程和工具入口。将复杂图谱与简洁任务界面交替，不让所有镜头都变成漫游关系图。
- 替换人物、项目和数据源时，按真实关联连线。个人写作习惯与组织资源分别保留一个示例，结果文本只需展示最关键段落。

## 内容替换

- 可替换为组织知识助理；保留个人→组织→代理的扩展。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Glean",
  "id": "V380",
  "palette": [
    "#f7f2e7",
    "#35223b",
    "#6c22c8",
    "#e8c4ef",
    "#d4ef90"
  ],
  "typography": "中等字重无衬线；紫色陈述句与白色结果卡分层",
  "sample": "Glean Assistant",
  "objects": [
    "柔和曲面",
    "提示栏",
    "结果文本",
    "人物节点",
    "项目节点",
    "工具图标",
    "网络连线"
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
      "timeSeconds": 14.0,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 27.0,
      "frameId": "K0080",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 45.0,
      "frameId": "K0120",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 69.0,
      "frameId": "K0177",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 79.0,
      "frameId": "K0206",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "柔和几何品牌",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "个人助理",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "任务输入",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "策划结果",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "个人写作",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "个人偏好图",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "企业关系图",
      "end": 58,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 58,
      "label": "创建代理",
      "end": 69,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 69,
      "label": "代理流程",
      "end": 74,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 74,
      "label": "工具生态",
      "end": 79,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 79,
      "label": "企业网络收束",
      "end": 91.933333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 91.933333,
  "fontFamily": "Arial, sans-serif"
}
```
