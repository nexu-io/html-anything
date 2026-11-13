# Hyperliquid 5-minute up/down HYPE polymarkets —…

把操作、等待和完成拆成三种明确状态。倒计时负责压缩等待，但开始与结束必须有清楚的触发。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 22.583333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "HYPE Up or Down",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#33c98d"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "HYPE Up or Down",
        "accent": "#33c98d"
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

## 先完成方向与金额

涨跌问题出现在表单之前，方向选项在同一行，金额置于其下。选中方向后填写金额，按钮确认再切入等待。

白底教学段与深色操作区交替，绿色突出选中与完成，蓝色负责品牌收尾。数字采用对齐字形，标题保持简短无衬线。

## 压缩时间，也保留时间逻辑

倒计时从确认之后开始，跳过中间等待时保持单调递减，并用明确的节奏让人知道时间被压缩。到零之后再显示领取或完成动作，不让结果与等待同时出现。

```motion-demo
{
  "id": "clip-2",
  "title": "压缩时间，也保留时间逻辑",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "9–16 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结果之后再放行动入口

领取反馈使用清楚的文字和单一状态符号，随后出现下一次行动与品牌。收益数字需要与实际条件绑定。

可以迁移到任务竞赛、倒计时预约或进度完成，保留操作完成、等待开始、完成解锁三道边界。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f4f7f3 · #101b1b · #33c98d · #255de1 · #171d25

## 元素与制作规则

问题标题 / 涨跌按钮 / 金额 / 价格线 / 倒计时 / 领取按钮 / 结果数字

- 表单选择后倒计时压缩跳变，到零后才出现领取
- 绿色曲线和收益字同步扩张，是状态强调而非真实数据测量
- 白底教学、深色操作、品牌色收尾三段分工明确

## 内容替换

- 保留操作时间→等待时间→完成反馈三种时段
- 可以换成任务竞赛或进度演示，倒计时压缩要明确

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Polymarket",
  "id": "V068",
  "palette": [
    "#f4f7f3",
    "#101b1b",
    "#33c98d",
    "#255de1",
    "#171d25"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "HYPE Up or Down",
  "objects": [
    "问题标题",
    "涨跌按钮",
    "金额",
    "价格线",
    "倒计时",
    "领取按钮",
    "结果数字"
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
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 10.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 16.0,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 21.0,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "涨跌问题",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "买卖表单",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "方向选择",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "填写金额",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "交易确认",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "快速倒计时",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "领取结果",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "回报主张",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "行动入口",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "品牌",
      "end": 22.583333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 22.583333,
  "fontFamily": "Arial, sans-serif"
}
```
