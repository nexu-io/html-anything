# Wide Research｜广泛研究

把宽泛研究画成“一个问题分给很多工作，再回到一张结果表”。重点是展开与汇总的关系，不是让屏幕上同时挤满窗口。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 44.366667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Wide Research",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Wide Research",
        "accent": "#538cbe"
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

## 从单一任务打开工作空间

开场只保留研究输入和对象范围，提交后再出现多个子任务面板。面板沿深度和网格展开，主任务位置保持可找到。

浅背景、细边框与轻阴影支撑大量信息；强调色标当前工作，标题、姓名与字段使用统一无衬线字体。

## 让并行数量可读

子任务可分批入场，运行和完成分别标注。数量增加时可缩小窗口，但不要缩到每个标题都无法辨认；需要展示规模时，让计数器承担数字，窗口承担分工。

子任务完成后转成统一记录，逐项汇入表格。收束方向应回到结果中心，而不是让窗口随机飞出画面。

```motion-demo
{
  "id": "clip-2",
  "title": "让并行数量可读",
  "src": "demos/clip-2.html",
  "duration": 17,
  "status": "authored",
  "description": "11–28 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结果表必须有统一字段

在研究对象、所属机构、研究方向等字段中选择能支撑结论的列。列名固定，内容行逐步填入；导出作为结果之后的最后动作。

迁移到用户研究、竞品或设计资料时，先定义每个对象都要回答的问题，再安排子任务和表格。保留一对多再多对一的工作关系。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

任务输入 / 并行子任务 / 完成计数 / 汇总表格 / 交付文件

- 一个输入分解为多个任务面板，横向纵深展开表达并行
- 子任务结果汇聚为同一表格，数量变化与任务完成相关
- 结尾展示可下载文件，而不是只给完成状态

## 内容替换

- 可换为批量设计审查或竞品整理，保留拆分→并行→汇总
- 对象数量可改但统计必须一致

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V232",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Wide Research",
  "objects": [
    "任务输入",
    "并行子任务",
    "完成计数",
    "汇总表格",
    "交付文件"
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
      "timeSeconds": 9.0,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 13.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/170e8a29ccc02b71891f4cca928f705da956deb814365721905cb4125dca6e62",
      "timeSeconds": 19.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/bac1c562ad67d01fe9171ecf415ff69b29a1fa6afc49d19ab63f977f97d1eb03",
      "timeSeconds": 28.0,
      "frameId": "K0086",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 38.0,
      "frameId": "K0117",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "大任务提问",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "大量对象",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "提交研究",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "拆解任务",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "并行执行",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "案例说明",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "研究过程",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "完成计数",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "汇总表格",
      "end": 33.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33.0,
      "label": "导出",
      "end": 38.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38.0,
      "label": "品牌",
      "end": 44.366667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 44.366667,
  "fontFamily": "Arial, sans-serif"
}
```
