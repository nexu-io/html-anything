# Supabase Explorer and Notebooks

先用增长图打开产品，再逐项证明查询、保存、自然语言和本地工作流，短句始终与正在演示的功能并置。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 58.25,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 34,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Explorer & Notebooks",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4ac796"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Explorer & Notebooks",
        "accent": "#4ac796"
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

## 左边一句能力，右边一个操作

产品名揭示后固定左侧短句区，右侧暗色界面展示对应操作。界面可略倾斜并缓慢前移，但 SQL 与结果的主要区域不能超出阅读范围。

## 数据表和图表共享同一查询

查询语句先出现，运行后填入表格，再切到绿色图形。保存段保留笔记标题，说明查询、数据和图表属于同一工作单元。

```motion-demo
{
  "id": "clip-2",
  "title": "数据表和图表共享同一查询",
  "src": "demos/clip-2.html",
  "duration": 7.5,
  "status": "authored",
  "description": "28.5–36 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 自然语言最终落到可见 SQL

输入问题后显示生成语句与结果；本地仓库段使用独立终端命令收尾。黑底、灰白正文、等宽代码和少量绿色形成稳定层级，不用霓虹泛光压低文字对比。

## 迁移时用完整的数据故事

替换项目名、查询、表格和图表时确保字段与数值一致。每段只讲一个可操作能力，保持固定短句区，最后交代成果如何保存或带走。

## 配色与字形

无衬线功能短句与等宽 SQL；黑底界面用弱分隔线，绿色图表突出数据。

#090b0b · #e9edea · #4ac796 · #1d2420 · #777f7b

## 元素与制作规则

倾斜界面 / 用户增长图 / SQL 编辑器 / 结果表 / 自然语言输入 / 本地命令

- 先用增长图打开产品，再逐项证明查询、保存、自然语言和本地工作流，短句始终与正在演示的功能并置。
- 产品名揭示后固定左侧短句区，右侧暗色界面展示对应操作。界面可略倾斜并缓慢前移，但 SQL 与结果的主要区域不能超出阅读范围。
- 查询语句先出现，运行后填入表格，再切到绿色图形。保存段保留笔记标题，说明查询、数据和图表属于同一工作单元。

## 内容替换

- 替换项目名、查询、表格和图表时确保字段与数值一致。每段只讲一个可操作能力，保持固定短句区，最后交代成果如何保存或带走。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Supabase",
  "id": "V386",
  "palette": [
    "#090b0b",
    "#e9edea",
    "#4ac796",
    "#1d2420",
    "#777f7b"
  ],
  "typography": "无衬线功能短句与等宽 SQL；黑底界面用弱分隔线，绿色图表突出数据",
  "sample": "Explorer & Notebooks",
  "objects": [
    "倾斜界面",
    "用户增长图",
    "SQL 编辑器",
    "结果表",
    "自然语言输入",
    "本地命令"
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
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 10.5,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 28.866666666666667,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 45.0,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 56.0,
      "frameId": "K0089",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "暗色窗口",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "页面骨架",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "User growth",
      "end": 7.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.4,
      "label": "柱图成形",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "Explorer 导航",
      "end": 11.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.5,
      "label": "产品主张",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "数据库与日志查询",
      "end": 28.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.8,
      "label": "保存查询与图表",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "自然语言输入",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "SQL 回应",
      "end": 52,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 52,
      "label": "本地仓库命令",
      "end": 56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 56,
      "label": "产品落版",
      "end": 58.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 58.25,
  "fontFamily": "Arial, sans-serif"
}
```
