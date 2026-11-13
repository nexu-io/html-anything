# Jitter Superagents｜产品能力展示

把一句操作要求与画布上的变化放在一起：重混模板、排列圆点、偏移轨道，最后扩展到不同尺寸和语言。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 37.933524,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Superagents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#30aceb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Superagents",
        "accent": "#30aceb"
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

## 指令要对应一个看得见的改变

模板重混前后保持内容结构；圆点排列由散乱转圆环，后续动作继续作用于这组点。指令框靠近画布，避免孤立的聊天截图。

```motion-demo
{
  "id": "clip-1",
  "title": "指令要对应一个看得见的改变",
  "src": "demos/clip-1.html",
  "duration": 4.699999999999999,
  "status": "authored",
  "description": "8–12.7 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 时间编辑与尺寸适配分别演示

轨道偏移需要同时看到条带与时间游标；尺寸适配需要保留同一标题和主图，在横、竖、方画板里重新排布。

## 数量在最后展开

单个画板操作讲清后，再拉远为多尺寸、多语言矩阵。黑白底承托彩色作品，蓝色只标记代理反馈与操作入口，批量导出标签盖在矩阵前。

## 换主题仍保留可编辑对象

准备可拆开的标题、图像和图形层，以及每个尺寸的重排规则。将批量变体做成同一内容家族，不用随机不同作品填数。

## 配色与字形

紧凑粗体标题；画布作品字形随模板，工具提示采用小字。

#eeeeef · #141416 · #30aceb · #d7ff00 · #8250b7

## 元素与制作规则

模板作品 / 提示框 / 圆点组 / 时间轨道 / 效果菜单 / 多尺寸画板 / 导出标签

- 模板重混前后保持内容结构；圆点排列由散乱转圆环，后续动作继续作用于这组点。指令框靠近画布，避免孤立的聊天截图。
- 轨道偏移需要同时看到条带与时间游标；尺寸适配需要保留同一标题和主图，在横、竖、方画板里重新排布。
- 单个画板操作讲清后，再拉远为多尺寸、多语言矩阵。黑白底承托彩色作品，蓝色只标记代理反馈与操作入口，批量导出标签盖在矩阵前。
- 准备可拆开的标题、图像和图形层，以及每个尺寸的重排规则。将批量变体做成同一内容家族，不用随机不同作品填数。

## 内容替换

- 替换模板内容、目标尺寸与语言；保留指令到变化的对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Jitter",
  "id": "V382",
  "palette": [
    "#eeeeef",
    "#141416",
    "#30aceb",
    "#d7ff00",
    "#8250b7"
  ],
  "typography": "紧凑粗体标题；画布作品字形随模板，工具提示采用小字",
  "sample": "Superagents",
  "objects": [
    "模板作品",
    "提示框",
    "圆点组",
    "时间轨道",
    "效果菜单",
    "多尺寸画板",
    "导出标签"
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
      "timeSeconds": 4.000020137668424,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 12.750064188818103,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 16.000080550673697,
      "frameId": "K0073",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 26.00013089484476,
      "frameId": "K0119",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/945673f567eb48b91bc1361af463d41cfec8c7f72f5ed6e81447bbccf4a46ac3",
      "timeSeconds": 33.0001661357645,
      "frameId": "K0150",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "巨大标题",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "模板作品带",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "主题重混提示",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "圆点编排",
      "end": 12.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.8,
      "label": "轨道偏移",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "效果选择",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "尺寸扩展",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "语言变体",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "批量矩阵",
      "end": 33,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33,
      "label": "导出入口",
      "end": 37.933524,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 37.933524,
  "fontFamily": "Arial, sans-serif"
}
```
