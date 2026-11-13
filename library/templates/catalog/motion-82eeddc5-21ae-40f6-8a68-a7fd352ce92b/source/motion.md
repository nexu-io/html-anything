# Whop — Introducing Whop Treasury: Earn 6% Yield on…

一次余额转移动作改变账户构成，再用图表与入金菜单扩展产品说明。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.16,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Move your balance",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2d56ad"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Move your balance",
        "accent": "#2d56ad"
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

## 表单与确认是两个步骤

Move 打开转账表单，金额输入完成后进入核对页，再确认。前后币种和金额保持一致，确认后才更新余额条与列表。

```motion-demo
{
  "id": "clip-1",
  "title": "表单与确认是两个步骤",
  "src": "demos/clip-1.html",
  "duration": 7,
  "status": "authored",
  "description": "8–15 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 蓝绿图表区分本金与增长

浅底面板、深色无衬线数字、蓝色本金与绿色增长建立信息层级。柱状图从短期展开到长期，轴线和图例固定，最终数字给稳定停留。

## 展示路径之后再给入金入口

流程结束后才介绍不同入金方式，最后用品牌物件进入标志页。主张、账户操作与长期图表分成三个段落，避免混为一张数据墙。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 介绍 |
| 2.00–4.50s | 收益主张 |
| 4.50–7.00s | 数据面板 |
| 7.00–8.00s | 余额构成 |
| 8.00–9.00s | Move |
| 9.00–13.00s | 转账表单 |
| 13.00–14.00s | 核对确认 |
| 14.00–18.00s | 余额更新 |
| 18.00–22.00s | 复利柱图 |
| 22.00–26.00s | 入金方式 |
| 26.00–28.00s | 品牌物件 |
| 28.00–32.16s | 品牌 |

## 替换主题时同步全部数值

更换金融或积分产品时，金额、单位、账户名称和图表必须互相一致。文案中的收益与数字按新产品实际信息重写，不沿用示例承诺。

## 配色与字形

无衬线界面与大金额；数字保持货币单位，强调色区分余额组成。

#fbfaf9 · #171717 · #2d56ad · #4fa26b · #dd5037

## 元素与制作规则

余额面板 / 构成进度条 / 转账弹窗 / 金额输入 / 增长图表 / 入金菜单

- 一次余额转移动作改变账户构成，再用图表与入金菜单扩展产品说明。
- Move 打开转账表单，金额输入完成后进入核对页，再确认。前后币种和金额保持一致，确认后才更新余额条与列表。
- 浅底面板、深色无衬线数字、蓝色本金与绿色增长建立信息层级。柱状图从短期展开到长期，轴线和图例固定，最终数字给稳定停留。

## 内容替换

- 更换金融或积分产品时，金额、单位、账户名称和图表必须互相一致。文案中的收益与数字按新产品实际信息重写，不沿用示例承诺。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Whop",
  "id": "V223",
  "palette": [
    "#fbfaf9",
    "#171717",
    "#2d56ad",
    "#4fa26b",
    "#dd5037"
  ],
  "typography": "无衬线界面与大金额；数字保持货币单位，强调色区分余额组成",
  "sample": "Move your balance",
  "objects": [
    "余额面板",
    "构成进度条",
    "转账弹窗",
    "金额输入",
    "增长图表",
    "入金菜单"
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
      "timeSeconds": 4.52,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 14.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 22.0,
      "frameId": "K0059",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 28.0,
      "frameId": "K0079",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "介绍",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "收益主张",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "数据面板",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "余额构成",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "Move",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "转账表单",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "核对确认",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "余额更新",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "复利柱图",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "入金方式",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "品牌物件",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "品牌",
      "end": 32.16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.16,
  "fontFamily": "Arial, sans-serif"
}
```
