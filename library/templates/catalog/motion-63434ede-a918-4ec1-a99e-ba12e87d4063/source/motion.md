# Cursor SDK — We’re introducing the Cursor SDK so you…

先写一个最小 SDK 例子，在旁边运行它，再只改配置切换执行环境。通过代码与终端的对应说明接口的一致性。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 35.033451,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Cursor SDK",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9966cc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Cursor SDK",
        "accent": "#9966cc"
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

## 代码按依赖顺序出现

从导入、创建代理、发送任务到事件处理逐段写出。当前代码段占据阅读中心，行号稳定，新增行向下扩展；不把整页代码从开头一次性缩得很小。

米白代码区与黑色终端形成清楚分工。代码用等宽字体和有限的语法色，活动配置行使用浅色底或强调色，标题沿用简洁无衬线。

## 运行时让终端承担进展

代码完成后缩到左栏，终端在右栏出现，先输入执行命令，再输出读取、修改、检查和完成信息。日志可以加快，但关键完成行要留停顿。

```motion-demo
{
  "id": "clip-2",
  "title": "运行时让终端承担进展",
  "src": "demos/clip-2.html",
  "duration": 10,
  "status": "authored",
  "description": "6–16 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 切环境，只高亮改变的几行

将本地路径改为云仓库或相应配置时，保留大部分代码不动。活动行短暂突出，然后重新执行并显示第二次结果。

两次运行保持同一目标，差异集中在执行位置；不要为了表现云端而把代码、任务和成果同时全部换掉。

## 更换示例前先准备可读的最小代码

选一项短任务，使配置与输出都能在屏幕里读完。将代码、终端命令和日志一起替换，保留最小配置、一次运行、小幅修改、再次运行的结构。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

代码行 / 行号 / 语法颜色 / 活动行 / 终端 / 输出日志 / 完成标记

- 代码从少到多写出后缩为左栏，右栏终端执行相同配置
- 本地改云端只高亮相关配置行，复用其余代码以说明接口一致
- 日志顺序为调用、变更、验证、完成

## 内容替换

- 可迁移为SDK教学，保留最小示例→执行→只改配置→再次执行
- 代码必须独立验证，原片文字不构成可运行代码承诺

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V074",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Cursor SDK",
  "objects": [
    "代码行",
    "行号",
    "语法颜色",
    "活动行",
    "终端",
    "输出日志",
    "完成标记"
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
      "timeSeconds": 4.000013447510308,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.000030256898192,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0b538ff8e4b52bc3348610f50a6832c8ca345c3940dc13d90602b227dabc99c9",
      "timeSeconds": 18.000060513796384,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 22.000073961306693,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 31.000104218204886,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "导入SDK",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "创建代理",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "事件处理",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "代码与终端并列",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "运行命令",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "工具输出",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "本地完成",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "替换配置",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "切换云仓库",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "再次执行",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "云端完成",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "品牌",
      "end": 35.033451,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 35.033451,
  "fontFamily": "Arial, sans-serif"
}
```
