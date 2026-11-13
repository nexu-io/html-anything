# Computer 上线 Automations

把自动化拆成两个看得懂的故事：外部事件触发一次，时间计划再触发一次；每个故事都交代条件、执行过程和结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 92.125367,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 19,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Automate anything",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#648eaa"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Automate anything",
        "accent": "#648eaa"
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

## 先排好两条触发路径

前半段讲事件通知，后半段讲周期任务。中间用短标题重置注意力，第二个案例沿用第一个案例的界面位置，让观众把差异集中理解为“触发方式变了”。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 标题 |
| 6.00–19.00s | 设置事件条件 |
| 19.00–25.00s | 创建自动化 |
| 25.00–31.00s | 通知触发 |
| 31.00–40.00s | 任务链执行 |
| 40.00–48.00s | 定时任务主张 |
| 48.00–64.00s | 创建周期任务 |
| 64.00–72.00s | 时间触发 |
| 72.00–81.00s | 输出结果 |
| 81.00–92.13s | 标题与品牌 |

## 让事件真正推动后续动作

先展示条件设置，再创建自动化；通知出现后，执行列表才开始推进。指针只负责明确点击位置，通知和任务状态负责交代因果。

```motion-demo
{
  "id": "clip-2",
  "title": "让事件真正推动后续动作",
  "src": "demos/clip-2.html",
  "duration": 25,
  "status": "authored",
  "description": "6–31 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 执行列表按依赖逐行推进

任务宜控制在三至五行。当前行使用强调色，已完成行收敛为稳定状态；结果面板在最后一个必要步骤完成后进入，不与首个加载状态同时出现。

## 周期任务突出时间信息

第二个案例依次给出周期、触发时刻和产物。时间节点需要有独立阅读停留，执行段可以加快；把重复设置过程压缩，把新的触发逻辑讲完整。

```motion-demo
{
  "id": "clip-4",
  "title": "周期任务突出时间信息",
  "src": "demos/clip-4.html",
  "duration": 33,
  "status": "authored",
  "description": "48–81 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 深蓝画布承接两套操作

用深蓝大背景与较亮的工作面板形成层次。主张标题使用衬线字，设置项和任务状态使用无衬线字；每次聚焦只强调一个操作区域，细线和光边随当前动作切换。

## 按“触发—工作—交付”一起换主题

替换内容时同时改事件、任务步骤和产物，保证三者属于同一业务。输入文案不超过三行；如果只演示一种触发方式，可以保留一个完整案例并直接进入品牌收尾。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#071128 · #edf0f6 · #648eaa · #152943 · #ffffff

## 元素与制作规则

触发条件 / 任务列表 / 通知条 / 时间节点 / 输出卡

- 事件触发与定时触发分成两个完整示例；每个都有条件→执行→产物。
- 任务链逐行激活，结果晚于处理步骤；抽象标题穿插操作证据。

## 内容替换

- 替换触发事件、计划频率和产物；保留双触发语法。
- 长文案控制在输入框三行以内，执行步骤宜三至五条。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V079",
  "palette": [
    "#071128",
    "#edf0f6",
    "#648eaa",
    "#152943",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Automate anything",
  "objects": [
    "触发条件",
    "任务列表",
    "通知条",
    "时间节点",
    "输出卡"
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
      "timeSeconds": 19.019000000000002,
      "frameId": "K0060",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 31.031,
      "frameId": "K0099",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f181ae8893cbf3ce992432900fd4a810b0c18f598c2962ddfcae41a0c6ad5f8d",
      "timeSeconds": 40.04,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 64.06400000000001,
      "frameId": "K0193",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 80.99758333333334,
      "frameId": "K0243",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标题",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "设置事件条件",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "创建自动化",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "通知触发",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "任务链执行",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "定时任务主张",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "创建周期任务",
      "end": 64,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 64,
      "label": "时间触发",
      "end": 72,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 72,
      "label": "输出结果",
      "end": 81,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 81,
      "label": "标题与品牌",
      "end": 92.125367,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 92.125367,
  "fontFamily": "Georgia, serif"
}
```
