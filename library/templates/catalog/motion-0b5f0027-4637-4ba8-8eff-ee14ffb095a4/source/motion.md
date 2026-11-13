# Cursor — now on iPad

让同一份工作在手机和平板上连续出现，再聚焦平板上的收件箱、审查和批注。设备变化之后，内容身份不能变化。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 27.766667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Create, review, merge",
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
        "title": "Create, review, merge",
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

## 先用同一成果连接设备

手机与平板都显示同一个任务或预览，设备切换时保留标题与主图。平板出现后留出侧栏和内容区，体现更宽空间带来的组织能力。

浅色界面、深色设备轮廓和温暖作品预览形成三层。工具文字用无衬线，作品标题可以使用自身品牌字体；强调色用于当前分类和审查状态。

## 收件箱把工作引向审查

进入 Inbox 后，任务与待审查数量分别变化。选择审查项再显示 PR 或变更卡，预览在卡片下方展开，避免从统计数字直接跳到无关作品。

```motion-demo
{
  "id": "clip-2",
  "title": "收件箱把工作引向审查",
  "src": "demos/clip-2.html",
  "duration": 10,
  "status": "authored",
  "description": "7–17 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 批注必须落在作品上

推近预览后，在需要修改的文字或区域画短线、圈选或批注。保持作品稳定，手写轨迹负责表达关注点；随后回到完整审查界面。

结尾用创建、审查、合并概括已发生的动作。换主题时同步更换预览、批注和审查说明，保留跨设备的同一任务。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

平板 / 手机 / 侧栏 / 任务计数 / PR卡 / 预览画面 / 手写批注 / 合并按钮

- 相同成果先跨设备展示，之后聚焦平板中的整理与审查能力
- 任务计数变化引出审查卡，预览上的批注必须锚定被评价内容
- 结尾用创建、审查、合并概括前段实际动作

## 内容替换

- 适合跨设备工作流，保留内容一致→任务整理→审查→确认
- 可替换网页作品与审查文本，设备和角色关系不变

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V254",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Create, review, merge",
  "objects": [
    "平板",
    "手机",
    "侧栏",
    "任务计数",
    "PR卡",
    "预览画面",
    "手写批注",
    "合并按钮"
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
      "timeSeconds": 5.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 10.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 14.0,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/24815100b650b89fcc5711822bf1990aef408e255f93bf710fc4820b7ef030ce",
      "timeSeconds": 18.0,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 25.0,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "平板与手机成果",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "iPad主张",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "回到平板",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "收件箱",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "任务和审查计数",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "完整审查",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "变更预览",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "手写批注",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "创建审查合并",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "品牌",
      "end": 27.766667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 27.766667,
  "fontFamily": "Arial, sans-serif"
}
```
