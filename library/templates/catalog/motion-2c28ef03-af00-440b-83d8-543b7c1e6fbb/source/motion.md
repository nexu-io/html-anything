# Agent SDK 发布

把“代理可以写成代码”落到配置、执行和运营三个层次。代码建立可控制性，运行看板说明结果可以被持续观察。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 28.4,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agents as code",
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
        "title": "Agents as code",
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

## 先给最小配置，再给运行状态

开场标题后出现代理文件或任务目录，构建状态变为部署完成，再进入运行看板。每次换到下一层都保留同一任务名，让代码与结果接得上。

## 安静的版面承托技术信息

白底说明页使用简洁无衬线字，一句只讲一个能力。代码或文件名使用等宽字形，看板数据采用对齐数字；温暖背景只出现在产品窗口外围，不压在文本下。

强调色用于选中任务、当前状态或关键计数，成功与运行中文字直接标明，不依赖色彩猜测。

## 运行之后，留一次改进动作

看板里同时保留任务名、时间和状态，先聚焦统计，再聚焦一项工作。随后输入新的扫描或改进要求，形成配置到运行，再到调整的闭环。

```motion-demo
{
  "id": "clip-3",
  "title": "运行之后，留一次改进动作",
  "src": "demos/clip-3.html",
  "duration": 12,
  "status": "authored",
  "description": "15–27 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 换任务，保留控制关系

可以替换为设计检查、资料整理或站点巡检。同步改代码配置、任务列表、评价项与下一轮请求；标题主张必须能在后续界面里找到对应操作。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

代码目录 / 状态条 / 部署反馈 / 运行计数 / 任务列表 / 评估输入

- 代码配置的抽象主张后必须配运行看板，证明过程可观测
- 构建中变为部署完成，再出现多任务状态计数
- 末段从看板回到新请求，形成运行→评估→迭代闭环

## 内容替换

- 适合开发平台；保留配置、执行、状态、改进四种对象
- 具体代码、指标、任务用途按目标产品替换

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V070",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Agents as code",
  "objects": [
    "代码目录",
    "状态条",
    "部署反馈",
    "运行计数",
    "任务列表",
    "评估输入"
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
      "timeSeconds": 8.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 19.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 21.0,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 27.0,
      "frameId": "K0054",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "品牌与SDK",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "代码驱动代理",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "构建部署",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "确定性主张",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "运行看板",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "状态统计",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "评估迭代",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "完善扫描任务",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "品牌",
      "end": 28.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 28.4,
  "fontFamily": "Arial, sans-serif"
}
```
