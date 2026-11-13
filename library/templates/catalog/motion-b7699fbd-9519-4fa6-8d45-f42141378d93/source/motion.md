# Supabase Pipelines — near real-time analytics sync

先把流量压力画出来，再通过配置目标和持续同步解释分工，让产品作用有明确的前因与后果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.102733,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 26.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Supabase Pipelines",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#27d48e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Supabase Pipelines",
        "accent": "#27d48e"
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

## 压力从正常变成可见的瓶颈

单库两侧数据条增多，延迟面板从绿色正常切到红色上升。黑底让流线与数值清楚，增长幅度和颜色同时变化，观众能看懂问题发生。

## 配置完成后才让数据流向另一端

增加目标、选择类型和区域、启动管线按顺序展示。启动后再画双数据库，细绿流线从源持续进入目标，不用双向箭头造成含义混淆。

```motion-demo
{
  "id": "clip-2",
  "title": "配置完成后才让数据流向另一端",
  "src": "demos/clip-2.html",
  "duration": 7.300000000000001,
  "status": "authored",
  "description": "14.2–21.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结构变化沿同一通路传播

左表增加字段后，变化标签沿连接线移动，到达右表后该字段出现并高亮。字段类型与名称保持一致；深蓝目标表区别于近黑源表。

## 替换为另一种同步产品

更换源、目标、字段与操作名时保留压力—分工—配置—同步的因果链。结语分别交代生产端与分析端的结果，不把所有变化写成速度更快。

## 配色与字形

无衬线短主张、等宽表字段；线框数据库与细绿色流线。

#050807 · #f0f5f1 · #27d48e · #17334e · #d77869

## 元素与制作规则

源数据库 / 请求流线 / 延迟图表 / 目标配置表单 / 目标数据库 / 字段表 / 同步状态

- 先把流量压力画出来，再通过配置目标和持续同步解释分工，让产品作用有明确的前因与后果。
- 单库两侧数据条增多，延迟面板从绿色正常切到红色上升。黑底让流线与数值清楚，增长幅度和颜色同时变化，观众能看懂问题发生。
- 增加目标、选择类型和区域、启动管线按顺序展示。启动后再画双数据库，细绿流线从源持续进入目标，不用双向箭头造成含义混淆。

## 内容替换

- 更换源、目标、字段与操作名时保留压力—分工—配置—同步的因果链。结语分别交代生产端与分析端的结果，不把所有变化写成速度更快。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Supabase",
  "id": "V388",
  "palette": [
    "#050807",
    "#f0f5f1",
    "#27d48e",
    "#17334e",
    "#d77869"
  ],
  "typography": "无衬线短主张、等宽表字段；线框数据库与细绿色流线",
  "sample": "Supabase Pipelines",
  "objects": [
    "源数据库",
    "请求流线",
    "延迟图表",
    "目标配置表单",
    "目标数据库",
    "字段表",
    "同步状态"
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
      "timeSeconds": 6.6066,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 13.013,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 19.019000000000002,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 25.025000000000002,
      "frameId": "K0058",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 34.034,
      "frameId": "K0081",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "产品标题",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "数据移动主张",
      "end": 5.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.4,
      "label": "单库",
      "end": 6.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.6,
      "label": "数据增加",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "延迟面板",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "红色过载",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "分工主张",
      "end": 14.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.4,
      "label": "增加目标",
      "end": 15.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.6,
      "label": "配置",
      "end": 18.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.3,
      "label": "启动",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "数据流",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "双库",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "结构同步",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "表字段",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "新字段传递",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "结语",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "品牌",
      "end": 36.102733,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.102733,
  "fontFamily": "Arial, sans-serif"
}
```
