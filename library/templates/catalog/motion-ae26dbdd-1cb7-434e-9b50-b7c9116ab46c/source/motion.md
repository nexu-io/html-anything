# AI Mode Home Services

让一句带条件的请求变成一组可以联系的服务结果。手机始终居中，重点在内容推进与列表滚动。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 25.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Find home services",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#478be3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Find home services",
        "accent": "#478be3"
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

## 把任务和限制写在同一问题里

白色手机放在淡彩背景中，输入框保持短而清楚。问题先交代要做什么，再给时间和地点，使用便于扫读的无衬线。

## 搜索之后再展开结果

用一个短处理中状态承接请求，随后出现服务概览。结果按服务商排列，名称、可用时间和联系入口保持固定列位。

## 滚动时保留列表身份

向下浏览时沿用同一条目顺序和高度，先看服务特色，再看时间。回到顶部时沿原列表返回，让观众理解空间位置。

```motion-demo
{
  "id": "clip-3",
  "title": "滚动时保留列表身份",
  "src": "demos/clip-3.html",
  "duration": 14,
  "status": "authored",
  "description": "10–24 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换成课程、场地或工具查找

替换问题限制和结果内容，保持每个结果都能回应最初条件。名称较长时换行，时间和联系入口保持短行。

## 配色与字形

白色手机、淡彩斜向背景、服务结果列表。

#f9fbff · #22262a · #478be3 · #81bd82 · #f4ce6a

## 元素与制作规则

手机 / 问题文本 / 搜索状态 / 服务商列表 / 可预约时间 / 联系按钮

- 问题包含任务和时间限制，结果逐项回应这些限制。
- 滚动改变可见内容，列表顺序和对象身份保持不变。
- 以联系方式和可预约时间作为结果落点。

## 内容替换

- 可换为课程或工具查找；保留约束→匹配→可执行结果。
- 替换价格和时间时维持列表内部一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V281",
  "palette": [
    "#f9fbff",
    "#22262a",
    "#478be3",
    "#81bd82",
    "#f4ce6a"
  ],
  "typography": "白色手机、淡彩斜向背景、服务结果列表",
  "sample": "Find home services",
  "objects": [
    "手机",
    "问题文本",
    "搜索状态",
    "服务商列表",
    "可预约时间",
    "联系按钮"
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
      "timeSeconds": 4.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 7.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 15.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 20.0,
      "frameId": "K0047",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 24.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "输入约束",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "搜索处理中",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "结果概览",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "浏览供应商",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "时间和联系方式",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "返回总览",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "品牌",
      "end": 25.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 25.866667,
  "fontFamily": "Arial, sans-serif"
}
```
