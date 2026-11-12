# Higgsfield API｜返现活动

用余额变化解释返现，而不只把优惠数字做大。醒目的利益点之后，立即交代额度、范围与期限。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 26.066667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "100% CASHBACK",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c1f51d"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "100% CASHBACK",
        "accent": "#c1f51d"
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

## 先让优惠一眼可见

大数字与返现名称组成主标题，硬币或币形从周边聚集，中心留给文字。白底配荧光绿和洋红，数字采用结实的无衬线粗体，条件说明用正常字重。

## 余额是解释机制的主画面

显示初始余额、支出、返还与最终余额。金额变化沿同一数值位置发生，支出和返还使用不同方向或状态词，避免只做无意义的数字滚动。

账户额度、总奖池与单户上限属于不同概念，分别标注，不让一个金额在不同镜头里悄悄换含义。

```motion-demo
{
  "id": "clip-2",
  "title": "余额是解释机制的主画面",
  "src": "demos/clip-2.html",
  "duration": 5,
  "status": "authored",
  "description": "8–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把使用条件留在行动入口之前

模型或服务范围、单户上限、截止时间与未使用额度处理方式依次交代。条件字不必与主金额一样大，但要有独立停留和足够对比。

换活动时先重算余额关系，更新优惠比例、适用对象、限额与期限，再调整品牌色、币形和入口。

## 配色与字形

无衬线界面文字与清晰大小层级。

#ffffff · #111111 · #c1f51d · #dd0284 · #c5c6bc

## 元素与制作规则

硬币 / 金额 / 余额面板 / 模型清单 / 时间限制

- 硬币强调收益，随后用余额减少与补回解释返现机制
- 数字大字与小限定条件成组，不可只迁移醒目金额
- 后段上限与截止时间收束行动条件

## 内容替换

- 可迁移为促销条款动画，必须保留额度、比例、期限与适用范围
- 硬币材质和品牌色可替换，余额计算关系保持一致

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Higgsfield",
  "id": "V322",
  "palette": [
    "#ffffff",
    "#111111",
    "#c1f51d",
    "#dd0284",
    "#c5c6bc"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "100% CASHBACK",
  "objects": [
    "硬币",
    "金额",
    "余额面板",
    "模型清单",
    "时间限制"
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
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 7.0,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0058",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0078",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 25.0,
      "frameId": "K0103",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "硬币与主张",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "API与币堆",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "奖池金额",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "先到先得",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "余额演示",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "模型清单",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "单户上限",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "截止日期",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "链接",
      "end": 26.066667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 26.066667,
  "fontFamily": "Arial, sans-serif"
}
```
