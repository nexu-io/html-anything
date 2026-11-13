# Perps 上线

按真实操作次序讲清一笔订单：选资产，设置金额和杠杆，配置风险条件，确认后查看持仓。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 37.125,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Trade Perps",
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
        "title": "Trade Perps",
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

## 从终端全貌推近订单

先建立导航和交易界面的全貌，再聚焦资产与订单面板。价格线和订单区分别占据稳定位置，推近时保留资产名，让读者知道仍在操作同一对象。

深色底与蓝色柔光承托终端，涨跌状态用红绿辅助。标题、表单标签使用无衬线，价格与金额采用对齐数字；避免颜色成为唯一状态信息。

## 字段依次激活，提交保持在最后

资产选择之后输入金额，再调杠杆，最后设置止盈止损。当前字段短暂突出，其余信息仍可读；滑块变化与旁边数字同步。

```motion-demo
{
  "id": "clip-2",
  "title": "字段依次激活，提交保持在最后",
  "src": "demos/clip-2.html",
  "duration": 12,
  "status": "authored",
  "description": "12–24 秒 · 动作示意",
  "initialTime": 0.6
}
```

| 先后 | 画面反馈 |
| --- | --- |
| 选择资产 | 名称与价格区同步更新 |
| 调整参数 | 字段数值与控制同步 |
| 确认订单 | 按钮先响应，再出现成交状态 |
| 查看持仓 | 显示持仓或平仓动作 |

## 用持仓反馈结束一轮操作

提交后回到持仓区，展示状态和后续平仓入口。结尾行动号召与网址独立停留。

替换为其他复杂表单时保留选择、配置、确认、反馈四步；金融题材同时保留必要条件与风险信息，演示数值不能变成结果承诺。

## 配色与字形

无衬线界面文字与清晰大小层级。

#0e1520 · #ffffff · #315ce8 · #33b085 · #f05563

## 元素与制作规则

资产行 / 图表 / 金额框 / 杠杆滑块 / 风险条件 / 订单按钮 / 持仓反馈

- 从全局终端推近操作表单，依次填写金额、杠杆、风险条件后才提交
- 成交后回到持仓查看并平仓，形成交易操作闭环
- 蓝色柔光承托深色UI，绿色红色仅表示状态

## 内容替换

- 迁移为复杂表单产品时保持选择→配置→确认→结果顺序
- 真实数字和收益需替换；不要把演示中盈利当保证

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Polymarket",
  "id": "V066",
  "palette": [
    "#0e1520",
    "#ffffff",
    "#315ce8",
    "#33b085",
    "#f05563"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Trade Perps",
  "objects": [
    "资产行",
    "图表",
    "金额框",
    "杠杆滑块",
    "风险条件",
    "订单按钮",
    "持仓反馈"
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
      "timeSeconds": 9.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 15.0,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 21.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 27.0,
      "frameId": "K0100",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0116",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "市场主张",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "导航入口",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "交易终端",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "选择资产",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "金额与杠杆",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "止盈止损",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "下单",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "持仓反馈",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "平仓",
      "end": 30.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30.0,
      "label": "行动号召",
      "end": 35.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35.0,
      "label": "品牌",
      "end": 37.125,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 37.125,
  "fontFamily": "Arial, sans-serif"
}
```
