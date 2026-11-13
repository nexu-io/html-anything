# Glean Agents 发布

从一个输入框展开到跨部门工作流。任务卡、人物和数据源通过连线建立关系，结果回到可读的界面。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 61.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 31,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Glean Agents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#3a2ee9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Glean Agents",
        "accent": "#3a2ee9"
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

## 先给一个统一入口

米白底上让蓝色球与荧光几何围绕短标题。目录界面出现后，把代理任务以小卡片分布到画面四周，中心仍保留主张或输入栏。

## 需求展开为按顺序执行的节点

提示框输入后切到纵向流程：触发器在上，搜索与信息汇总依次向下。卡片之间用箭头接通，下一步的入场晚于上一节点。

```motion-demo
{
  "id": "clip-2",
  "title": "需求展开为按顺序执行的节点",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "25–32 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把部门规模与知识范围分开讲

人物与部门分组用于说明谁在用，数据源连线用于说明从哪里获得信息；不要把两套网络挤在同一张图中。最后再汇成代理矩阵与品牌。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 浮动几何标题 |
| 5.00–8.00s | 代理目录 |
| 8.00–12.00s | 任务围绕 |
| 12.00–18.00s | 跨部门 |
| 18.00–25.00s | 输入需求 |
| 25.00–32.00s | 工作流节点 |
| 32.00–37.00s | 编辑器结果 |
| 37.00–46.00s | 知识入口 |
| 46.00–53.00s | 问答结果 |
| 53.00–56.00s | 企业治理 |
| 56.00–61.00s | 代理矩阵 |

## 替换时准备完整工作流

至少准备一条真实需求、三步处理和结果示例；部门与工具图标可换，但触发条件、执行顺序和结果格式要一致。

## 配色与字形

紧凑无衬线标题；功能描述保留短句，流程卡使用界面正文。

#f3f1e6 · #252323 · #3a2ee9 · #dbff59 · #f3b59d

## 元素与制作规则

几何标 / 代理任务卡 / 部门标签 / 提示栏 / 工作流节点 / 回答卡 / 治理锁

- 米白底上让蓝色球与荧光几何围绕短标题。目录界面出现后，把代理任务以小卡片分布到画面四周，中心仍保留主张或输入栏。
- 提示框输入后切到纵向流程：触发器在上，搜索与信息汇总依次向下。卡片之间用箭头接通，下一步的入场晚于上一节点。
- 人物与部门分组用于说明谁在用，数据源连线用于说明从哪里获得信息；不要把两套网络挤在同一张图中。最后再汇成代理矩阵与品牌。
- 至少准备一条真实需求、三步处理和结果示例；部门与工具图标可换，但触发条件、执行顺序和结果格式要一致。

## 内容替换

- 适合企业助理与自动化平台，保留入口、流程、结果、规模四层。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Glean",
  "id": "V379",
  "palette": [
    "#f3f1e6",
    "#252323",
    "#3a2ee9",
    "#dbff59",
    "#f3b59d"
  ],
  "typography": "紧凑无衬线标题；功能描述保留短句，流程卡使用界面正文",
  "sample": "Glean Agents",
  "objects": [
    "几何标",
    "代理任务卡",
    "部门标签",
    "提示栏",
    "工作流节点",
    "回答卡",
    "治理锁"
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
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 18.0,
      "frameId": "K0055",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 32.0,
      "frameId": "K0092",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 46.0,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 56.0,
      "frameId": "K0146",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "浮动几何标题",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "代理目录",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "任务围绕",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "跨部门",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "输入需求",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "工作流节点",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "编辑器结果",
      "end": 37,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37,
      "label": "知识入口",
      "end": 46,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46,
      "label": "问答结果",
      "end": 53,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 53,
      "label": "企业治理",
      "end": 56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 56,
      "label": "代理矩阵",
      "end": 61.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 61.0,
  "fontFamily": "Arial, sans-serif"
}
```
