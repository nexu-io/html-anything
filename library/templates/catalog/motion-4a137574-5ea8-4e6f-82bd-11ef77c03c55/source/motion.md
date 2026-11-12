# CodeRabbit [blocked] Triage

先展示排队与催审带来的负担，再把列表转为按紧急程度、近期变化和推进情况排序的看板。橙色始终追踪最需要处理的一项。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 69.102367,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 41,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "CodeRabbit Triage",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f07946"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "CodeRabbit Triage",
        "accent": "#f07946"
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

## 把请求拥挤感限制在开场

黑底消息卡短促叠入，随后切到较小的请求列表。镜头拉近时只放大一行，其余内容退暗，给“先处理哪一个”建立焦点。

```motion-demo
{
  "id": "clip-1",
  "title": "把请求拥挤感限制在开场",
  "src": "demos/clip-1.html",
  "duration": 6,
  "status": "authored",
  "description": "13–19 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 排序条件比卡片装饰更重要

紧急程度、近期变化与推进情况用三组绿色标签围绕看板出现。条件出现后，卡片重新排位；高风险项以橙色标签保持可见。

```motion-demo
{
  "id": "clip-2",
  "title": "排序条件比卡片装饰更重要",
  "src": "demos/clip-2.html",
  "duration": 8,
  "status": "authored",
  "description": "30–38 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 让结尾落在可执行的一项

选中请求展开摘要、变更类型和风险提示，光标落到开始审查。文案宜短，代码块只是上下文，避免抢占主控件的阅读空间。

## 替换为其他队列时保留排序逻辑

可用于工单、内容审核或任务分诊；同步替换排序条件、卡片摘要与操作按钮。优先级变化应有业务依据，不做随机洗牌。

## 配色与字形

粗无衬线短主张；界面文字紧凑，风险与优先级用小标签。

#0c0e12 · #f5f4f1 · #f07946 · #91db83 · #424751

## 元素与制作规则

催审消息 / 请求列表 / 选中行 / 分诊看板 / 排序条件 / 风险标签 / 代码块

- 黑底消息卡短促叠入，随后切到较小的请求列表。镜头拉近时只放大一行，其余内容退暗，给“先处理哪一个”建立焦点。
- 紧急程度、近期变化与推进情况用三组绿色标签围绕看板出现。条件出现后，卡片重新排位；高风险项以橙色标签保持可见。
- 选中请求展开摘要、变更类型和风险提示，光标落到开始审查。文案宜短，代码块只是上下文，避免抢占主控件的阅读空间。
- 可用于工单、内容审核或任务分诊；同步替换排序条件、卡片摘要与操作按钮。优先级变化应有业务依据，不做随机洗牌。

## 内容替换

- 替换队列对象与排序依据；保留过载→分诊→高优先级行动。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "CodeRabbit",
  "id": "V179",
  "palette": [
    "#0c0e12",
    "#f5f4f1",
    "#f07946",
    "#91db83",
    "#424751"
  ],
  "typography": "粗无衬线短主张；界面文字紧凑，风险与优先级用小标签",
  "sample": "CodeRabbit Triage",
  "objects": [
    "催审消息",
    "请求列表",
    "选中行",
    "分诊看板",
    "排序条件",
    "风险标签",
    "代码块"
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
      "timeSeconds": 13.013,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 23.990633333333335,
      "frameId": "K0095",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 30.03,
      "frameId": "K0120",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 46.046,
      "frameId": "K0177",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 64.06400000000001,
      "frameId": "K0236",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "请求过载",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "消息催审",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "拉取请求列表",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "选中关键项",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "分诊看板",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "排序依据",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "优先级结果",
      "end": 46,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46,
      "label": "风险与代码",
      "end": 58,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 58,
      "label": "选择与行动",
      "end": 64,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 64,
      "label": "品牌锁定",
      "end": 69.102367,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 69.102367,
  "fontFamily": "Arial, sans-serif"
}
```
