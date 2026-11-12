# Cursor · 递归任务编排

用一棵逐步生长的任务树解释递归协作。规划、执行和复核是不同角色，图形展开应当遵守它们的先后关系。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 20.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Orchestrate",
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
        "title": "Orchestrate",
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

## 从一条命令长出第一层分工

输入任务后出现主规划器，先连接执行者，再在相应工作后安排复核角色。不要开场就给完整复杂树，让读者有机会建立角色含义。

白色大留白、短标签和细连线保持图的清晰。规划与复核用不同强调色，执行节点更中性；节点字体统一为简短无衬线。

## 子规划器继续展开同一种规则

任务需要细分时，从该分支生出子规划器，再产生自己的工作与复核节点。树向一个主要方向增长，连线尽量采用清楚的折线路径，避免穿过标签。

复核完成后更新该分支状态，再折叠局部细节。折叠不是删除任务来源，父节点要保留已完成的关系。

## 角色不变，树深可以变化

换成研究、设计或工程任务时，按真实分工决定节点数量和层级。保留规划产生工作、工作接受复核、结果回到上层的结构；不要把同层位置误当成严格串行。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

输入框 / 命令标签 / 规划器 / 子规划器 / 执行者 / 验证者 / 树线

- 顶层规划先产生任务，任务继续分叉为子规划与工作节点
- 验证者在对应工作之后变色，完成后局部图折叠
- 连线使用简洁正交树结构，颜色区分规划与验证职责

## 内容替换

- 可迁移到层级任务编排，保留依赖树与先执行后验证
- 树深和节点数可变，但同层不等于执行顺序相同

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V075",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Orchestrate",
  "objects": [
    "输入框",
    "命令标签",
    "规划器",
    "子规划器",
    "执行者",
    "验证者",
    "树线"
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
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 14.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "输入任务",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "命令补全",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "主规划器",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "工作与验证",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "功能说明",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "递归分叉",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "子规划与工作",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "验证完成",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "名称与命令",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "品牌",
      "end": 20.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 20.033333,
  "fontFamily": "Arial, sans-serif"
}
```
