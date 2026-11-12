# Polymarket · 五分钟方向选择

将复杂市场操作压成一个可读的问题和两个选择。价格线提供背景，方向选择与确认动作成为主线。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 20.645625,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Up or down?",
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
        "title": "Up or down?",
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

## 一个问题，两种方向

开场先给资产与时间范围，再出现 Up、Down 两个互斥选项。问题文字完整可读，选择后用状态词、边框或按钮填色表达结果。

深色界面配蓝色强调，红绿只辅助方向。主问题用较大的无衬线字，金额与时间使用稳定数字宽度，图表不抢过操作卡。

## 金额输入之后才有购买反馈

价格线持续在侧边变化，选中方向后输入金额，再点击确认。成交标签与结果数字出现时，保留刚才的选择与金额，避免上下文被整屏替换。

## 短片只讲完一次选择

不要为这段演示加入多个无关资产。最后用简化终端和入口收束。

换成非金融决策或二选一教学时，保留问题、选择、确认、反馈；如果仍为交易题材，条件与风险文字须随新的数值和产品一并更新。

## 配色与字形

无衬线界面文字与清晰大小层级。

#0e1520 · #ffffff · #315ce8 · #33b085 · #f05563

## 元素与制作规则

资产符号 / 价格线 / 时间段 / 二元选择 / 金额 / 成交标签 / 收益数字

- 先给判断问题，再把复杂终端聚焦为二选一操作
- 方向选择改变按钮状态，金额输入后才有成交反馈
- 短倒计时与大数字用于强化节奏，不等于真实市场速度

## 内容替换

- 可迁移到非金融二选一决策教学，保留问题→选择→提交→状态反馈
- 涉及商业回报时必须带实际条件，不沿用源示例收益

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Polymarket",
  "id": "V067",
  "palette": [
    "#0e1520",
    "#ffffff",
    "#315ce8",
    "#33b085",
    "#f05563"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Up or down?",
  "objects": [
    "资产符号",
    "价格线",
    "时间段",
    "二元选择",
    "金额",
    "成交标签",
    "收益数字"
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
      "timeSeconds": 4.004,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 6.005999999999999,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 10.01,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 13.013,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 19.019,
      "frameId": "K0073",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "货币符号",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "快节奏主张",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "五分钟入口",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "图表与选项",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "选择方向和金额",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "购买反馈",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "概率与回报",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "极简终端",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "品牌",
      "end": 20.645625,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 20.645625,
  "fontFamily": "Arial, sans-serif"
}
```
