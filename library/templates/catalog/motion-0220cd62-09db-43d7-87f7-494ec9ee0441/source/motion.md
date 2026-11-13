# Polymarket｜Perps 赛事数据面板

把赛事信息排成一条参与路径：什么比赛、如何参加、如何排名、怎样奖励、何时开始。主视觉必须与规则一起成立。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Perps Competition",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#315ce8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Perps Competition",
        "accent": "#315ce8"
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

## 赛事名称和周期先出现

标题与周期形成开场，资产或工具标记交代比赛内容。深蓝或黑底配亮蓝强调，奖金与名次采用大号无衬线数字，条款保持足够对比。

## 从参与动作进入排名

先展示相关操作或进入方式，再用刻度或大数字展开奖池。排行榜随后出现，突出某一名次时，对应奖励卡同步变化。

## 排名与奖励必须一一对应

榜单的名次、参与者和表现分列，奖励区间另有清楚标签。单项奖励和总奖池分开标注，不用相同位置的一串数字替代不同概念。

| 规则信息 | 应同时显示 |
| --- | --- |
| 总奖池 | 活动周期与口径 |
| 排名奖励 | 对应名次区间 |
| 参赛时间 | 开始与截止 |
| 参与入口 | 适用条件与必要条款 |

## 倒计时指向下一场行动

奖励讲清之后再出现倒计时、日期和入口，末尾回到品牌。

迁移到设计比赛、产品挑战或团队活动时，更新参与条件、评分方式和奖励表。保留规则与行动的对应，不只替换赛事名称。

## 配色与字形

无衬线界面文字与清晰大小层级。

#0e1520 · #ffffff · #315ce8 · #33b085 · #f05563

## 元素与制作规则

赛事标题 / 资产卡 / 杠杆 / 奖池刻度 / 排行榜 / 奖项表 / 倒计时 / 条款

- 活动发布后说明参与方式，再展开排名和奖励的映射
- 排行榜突出一行时对应奖金卡保持同一名次，不能随意漂移
- 日期、周期、风险条款和入口共同收尾

## 内容替换

- 迁移到竞赛活动时保留周期→参与→排名→奖励→截止条件
- 不得只保留醒目奖金而删掉条件与风险信息

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Polymarket",
  "id": "V333",
  "palette": [
    "#0e1520",
    "#ffffff",
    "#315ce8",
    "#33b085",
    "#f05563"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Perps Competition",
  "objects": [
    "赛事标题",
    "资产卡",
    "杠杆",
    "奖池刻度",
    "排行榜",
    "奖项表",
    "倒计时",
    "条款"
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
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 14.0,
      "frameId": "K0056",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 22.0,
      "frameId": "K0099",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f921c7b7c18ed9004077c1299b4b4c76f7a7fa76ab8a8ed4d7887f0ed6f1994b",
      "timeSeconds": 28.0,
      "frameId": "K0123",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 34.0,
      "frameId": "K0142",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "赛事公布",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "周期",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "杠杆与资产",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "参数界面",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "奖池刻度",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "进入条件",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "排行榜",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "奖励区间",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "倒计时",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "比赛日期",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "入口",
      "end": 34.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34.0,
      "label": "品牌",
      "end": 36.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.033333,
  "fontFamily": "Arial, sans-serif"
}
```
