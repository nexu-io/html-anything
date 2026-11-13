# Cursor Builds — cloud agents start 3x faster

先用同时开始的前后对照说明速度，再用一次局部失败说明恢复方式。把“更快”和“容易处理问题”分开讲清楚。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 19.9,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Cloud agents start faster",
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
        "title": "Cloud agents start faster",
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

## 两组从同一时点开始

Before 与 After 窗口尺寸一致、基线一致，计时同时启动。进度变化可以不同，但必须比较同一类工作，不能让两边暗中采用不同起点。

浅背景承托两组界面，前后使用可区分的暖色与绿色。标签、秒数和完成状态采用清晰无衬线字与对齐数字；完成文字在浅底上使用深色。

## 新流程完成后，旧流程仍可见

右侧先出现可用界面或完成标记，左侧继续显示自己的进度。保留一小段并置时间，让差异可以直接看见，然后再切到下一项能力。

## 遇到失败时给出下一步

局部构建项出现失败提示，其余完成项保留。推近 Debug with Agent 或对应修复入口，点击后显示继续处理的方向，不用抹掉错误来制造全程成功。

```motion-demo
{
  "id": "clip-3",
  "title": "遇到失败时给出下一步",
  "src": "demos/clip-3.html",
  "duration": 6,
  "status": "authored",
  "description": "9–15 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换案例时重做比较条件

用新任务的实际起点、结束条件和时长替换对照。可以沿用双窗口和进度条，但速度主张须与显示内容一致；恢复段保留明确的错误和可执行入口。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

前后双窗口 / 独立计时条 / 构建步骤 / 成功框 / 错误提示 / 调试按钮

- 两组同时开始但进度速度不同，新流程先显示成果
- 随后承认一个局部失败，提供调试按钮而不是宣称所有任务成功
- 速度与可恢复性分段说明，二者不混成单一数字

## 内容替换

- 可迁移为性能对比演示，必须固定起点与同一工作量
- 对比数值须来自测量；示例倍速仅复述原片主张

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V257",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Cloud agents start faster",
  "objects": [
    "前后双窗口",
    "独立计时条",
    "构建步骤",
    "成功框",
    "错误提示",
    "调试按钮"
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
      "timeSeconds": 3.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 7.0,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 13.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 18.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "前后对比",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "速度主张",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "同时启动",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "新流程先完成",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "韧性主张",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "构建步骤",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "错误提示",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "调试入口",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "总结",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "品牌",
      "end": 19.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 19.9,
  "fontFamily": "Arial, sans-serif"
}
```
