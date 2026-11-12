# Cursor Multitask / Subagents — /multitask in the new…

让一个会话持续接收任务，同时把正在执行的工作留在可见位置。重点是并行中的秩序，而不是窗口数量。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.9,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Multitask",
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
        "title": "Multitask",
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

## 入口先推近，执行再回到全局

先让观众读到多项任务和并行按钮，点击后缩回完整应用窗口。主会话继续向下展开，工作项面板保持固定区域。

白色工作区、浅灰任务块与少量强调色足够支撑流程。正文采用常规无衬线，任务名称略粗，状态与时间保持紧凑。

## 每项任务都有自己的身份与状态

追加第二项任务时，第一项仍保留在工作列表里。各任务分别进入排队、运行和完成，不用同一个进度条代表全部工作。

需要展示日志时，只展开当前关注项；其他任务保留短状态，避免四份长日志同时争夺阅读位置。

## 继续输入，是并行能力的证据

任务还在运行时再输入新需求，让画面自然说明会话没有被占住。结尾可以停在继续执行的状态，不必把所有项目强行做成成功。

换业务时为各工作项准备不同内容和状态变化，保留固定列表、连续会话和独立反馈。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

应用窗口 / 输入框 / 并行按钮 / 多项任务 / 状态面板 / 滚动对话

- 同一会话追加多任务，工作项面板固定标明并行数量
- 窗口先推近入口再缩回全局，随后靠滚动文字表现执行
- 任务的运行与完成分开显示，不能把在途项全部画成成功

## 内容替换

- 可换任何并行工作工具；保留一个入口→多个在途项→逐项反馈
- 对象文本换为新业务，任务列表身份保持稳定

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V073",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Multitask",
  "objects": [
    "应用窗口",
    "输入框",
    "并行按钮",
    "多项任务",
    "状态面板",
    "滚动对话"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/12ef0753b87b51408d5fc21884b27109d0652a21c07b75c9ae5e6dc719cf328e",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/bec759cc3758bdcb5611ff6803a32b3e0b71bf075e40b1ff4a08eaefc8d305e5",
      "timeSeconds": 5.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 11.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/1aa771281a3fdfa8a8bd4c2f35963a9d5547fa6d13a8d0d741951ad1ade9e183",
      "timeSeconds": 14.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c4fc9ae6e0a765506d020412269e8f77ede573208753127ba25a758cb762d3ea",
      "timeSeconds": 22.0,
      "frameId": "K0068",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "任务输入",
      "end": 1.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.0,
      "label": "推近并行按钮",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "启动并行",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "代理回复",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "第二项任务",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "四个工作项",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "任务日志",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "后续操作",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "继续执行",
      "end": 24.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.9,
  "fontFamily": "Arial, sans-serif"
}
```
