# Lovable｜Google 连接器

把连接器从图标变成可执行任务：每个工具先进入请求，再产生相应应用，最后把成果汇成一组。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 46.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Google × Lovable",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed3b99"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Google × Lovable",
        "accent": "#ed3b99"
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

## 先交代连接关系

中心品牌周围分布外部工具标记，连线或轨道只表达连接。随后让其中一个工具变成输入框中的标签，把抽象连接带入第一个真实请求。

深色背景与渐变柔光形成统一舞台，工具保持各自的品牌色。产品标题用无衬线粗体，输入、选项与界面数据用常规字重。

![0.00s · 构图参考](assets/reference-1.jpg)

## 每种工具，给一种对应成果

数据请求对应仪表盘，商品信息对应选择器，预约对应日历，邮件任务对应回复，地点请求对应地图。不要把所有工具的成果都画成柱状图。

结果出现后留一个实际操作：选择尺码、挑选时间、确认回复或点选地点。点击之后必须有选中、确认或内容更新。

## 请求与操作之间留阅读空间

每个案例按工具标签、短请求、成果、局部操作推进。案例之间可以快切；一次点击的前后状态要能分清。结尾缩小不同成果拼成工作墙，强调同一入口覆盖多种任务。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 连接器图标围绕 |
| 4.00–6.00s | 数据请求 |
| 6.00–10.00s | 仪表盘 |
| 10.00–15.00s | 选鞋应用 |
| 15.00–18.00s | 预约请求 |
| 18.00–22.00s | 日历选择 |
| 22.00–27.00s | 邮件任务 |
| 27.00–31.00s | 发送回复 |
| 31.00–34.00s | 地图请求 |
| 34.00–39.00s | 门店选择 |
| 39.00–45.00s | 成果墙 |
| 45.00–46.17s | 品牌 |

## 换业务时，连工具一起换

选择新业务需要的数据源与工具，再设计对应结果。提示词、连接器标签、数据内容、操作选项同时迁移；保留工具到任务、任务到成果的关系。

## 配色与字形

无衬线界面文字与清晰大小层级。

#101013 · #ffffff · #ed3b99 · #778df2 · #fb6740

## 元素与制作规则

中心品牌 / 外部工具图标 / 请求卡 / 成果界面 / 指针

- 多个工具图标先聚合，之后逐个成为提示框中的连接器标签
- 每个请求后展示可操作结果，点击局部产生选择反馈
- 结尾不同成果缩为墙面，强调同一连接系统覆盖多任务

## 内容替换

- 主题迁移保留工具→请求→成果→操作的四拍结构
- 替换实际工具和数据，同时替换结果类型，不能仅替换logo

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Lovable",
  "id": "V299",
  "palette": [
    "#101013",
    "#ffffff",
    "#ed3b99",
    "#778df2",
    "#fb6740"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Google × Lovable",
  "objects": [
    "中心品牌",
    "外部工具图标",
    "请求卡",
    "成果界面",
    "指针"
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
      "timeSeconds": 6.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 15.0,
      "frameId": "K0071",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 27.0,
      "frameId": "K0128",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0c475038b5061160ceb8f07060b4f0c05da5d95871b49c69d8a5f71bc8fc6b8d",
      "timeSeconds": 34.0,
      "frameId": "K0156",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 45.0,
      "frameId": "K0200",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "连接器图标围绕",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "数据请求",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "仪表盘",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "选鞋应用",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "预约请求",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "日历选择",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "邮件任务",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "发送回复",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "地图请求",
      "end": 34.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34.0,
      "label": "门店选择",
      "end": 39.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39.0,
      "label": "成果墙",
      "end": 45.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45.0,
      "label": "品牌",
      "end": 46.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 46.166667,
  "fontFamily": "Arial, sans-serif"
}
```
