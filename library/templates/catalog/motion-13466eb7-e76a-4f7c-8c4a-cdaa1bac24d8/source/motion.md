# OKX AI — AI agents can already work, create, and earn.

从一个人扩展到一组代理，再进入服务选择和履约过程。紫色块贯穿人物、目录与选中状态，保持同一个行动主线。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 30.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 21,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "OKX Agents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9e79f5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "OKX Agents",
        "accent": "#9e79f5"
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

## 人数变化先于界面介绍

灰度人物与植物画面承托简短主张，单个人复制成列后切到代理网格。紫色矩形作为重音遮片与词块，黑白图像保持低饱和。

## 先选类别，再选具体服务

类别列表只突出一项，再进入代理列表和详情。名称、评分、价格与操作按钮要放在同一信息区，焦点由紫色高亮传递。

```motion-demo
{
  "id": "clip-2",
  "title": "先选类别，再选具体服务",
  "src": "demos/clip-2.html",
  "duration": 9,
  "status": "authored",
  "description": "10–19 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 履约用一条连续状态线

打开、接受、提交、审查和完成依次点亮，当前状态向右推进。最后给一句结算主张再落品牌，不混入新的任务或代理。

```motion-demo
{
  "id": "clip-3",
  "title": "履约用一条连续状态线",
  "src": "demos/clip-3.html",
  "duration": 5,
  "status": "authored",
  "description": "19–24 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换场景时重写服务信息

可迁移到创作、研发或业务服务市场。演示价格、评分和状态使用清楚的示例内容，保持目录→详情→执行→完成的结构。

## 配色与字形

等宽短句与粗无衬线口号交替；流程状态用清楚的小标签。

#080808 · #f1f0ee · #9e79f5 · #4a405c · #888888

## 元素与制作规则

人物剪影 / 紫色块 / 服务菜单 / 代理列表 / 详情卡 / 履约状态 / 品牌标

- 灰度人物与植物画面承托简短主张，单个人复制成列后切到代理网格。紫色矩形作为重音遮片与词块，黑白图像保持低饱和。
- 类别列表只突出一项，再进入代理列表和详情。名称、评分、价格与操作按钮要放在同一信息区，焦点由紫色高亮传递。
- 打开、接受、提交、审查和完成依次点亮，当前状态向右推进。最后给一句结算主张再落品牌，不混入新的任务或代理。
- 可迁移到创作、研发或业务服务市场。演示价格、评分和状态使用清楚的示例内容，保持目录→详情→执行→完成的结构。

## 内容替换

- 替换服务类目、代理与履约节点；保留选择和执行链。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OKX",
  "id": "V196",
  "palette": [
    "#080808",
    "#f1f0ee",
    "#9e79f5",
    "#4a405c",
    "#888888"
  ],
  "typography": "等宽短句与粗无衬线口号交替；流程状态用清楚的小标签",
  "sample": "OKX Agents",
  "objects": [
    "人物剪影",
    "紫色块",
    "服务菜单",
    "代理列表",
    "详情卡",
    "履约状态",
    "品牌标"
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
      "timeSeconds": 6.0,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 15.0,
      "frameId": "K0066",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/a81c06dfa929c19eae0acf2f96ab6ecafa79922c54356380233c2ff9ac55372e",
      "timeSeconds": 17.0,
      "frameId": "K0079",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 23.0,
      "frameId": "K0105",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 29.0,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "单个人",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "个体复制",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "代理团队",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "服务类别",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "工具执行",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "选择代理",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "履约状态",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "结算主张",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "新模式主张",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 30.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 30.0,
  "fontFamily": "ui-monospace, monospace"
}
```
