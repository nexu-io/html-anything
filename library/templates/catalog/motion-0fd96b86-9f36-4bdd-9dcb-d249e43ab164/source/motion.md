# Framer 接入 Cursor

从键盘近景过渡到暗色输入框，输入完成后切到 CMS 表格。让蓝框顺着行列表出现，说明一条请求影响多条数据。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.958333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Framer is now in Cursor",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#315dfb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Framer is now in Cursor",
        "accent": "#315dfb"
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

## 把一次输入接到一批结果

从键盘近景过渡到暗色输入框，输入完成后切到 CMS 表格。让蓝框顺着行列表出现，说明一条请求影响多条数据。

```motion-demo
{
  "id": "clip-1",
  "title": "把一次输入接到一批结果",
  "src": "demos/clip-1.html",
  "duration": 3.3000000000000007,
  "status": "authored",
  "description": "5.5–8.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用缩放衔接三个信息尺度

输入特写、表格全貌和发布标题使用不同景别；数据视图缩小退出后，白字标题从超大画幅回到中央。黑底和蓝色细边保持一致。

## 最后只留下接入关系

结论写成两行短句，留读后收为两个等视觉重量的标志，中间用乘号。替换品牌时保留“输入—结果—接入公告”的因果链。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 键盘与输入框 |
| 2.00–5.50s | 输入任务 |
| 5.50–9.50s | 数据行批量变更 |
| 9.50–13.50s | 发布结论缩小 |
| 13.50–15.96s | 双品牌结束 |

## 配色与字形

黑底白色中等字重无衬线；蓝色只标记被操作的数据行。。

#080808 · #ffffff · #315dfb · #242424 · #929292

## 元素与制作规则

任务输入框 / CMS 行列表 / 蓝色选择边框 / 结论标题 / 双品牌标志

- 从键盘近景过渡到暗色输入框，输入完成后切到 CMS 表格。让蓝框顺着行列表出现，说明一条请求影响多条数据。
- 输入特写、表格全貌和发布标题使用不同景别；数据视图缩小退出后，白字标题从超大画幅回到中央。黑底和蓝色细边保持一致。
- 结论写成两行短句，留读后收为两个等视觉重量的标志，中间用乘号。替换品牌时保留“输入—结果—接入公告”的因果链。

## 内容替换

- 替换任务、数据列和双品牌，保留单次输入引发批量结果。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V152",
  "palette": [
    "#080808",
    "#ffffff",
    "#315dfb",
    "#242424",
    "#929292"
  ],
  "typography": "黑底白色中等字重无衬线；蓝色只标记被操作的数据行。",
  "sample": "Framer is now in Cursor",
  "objects": [
    "任务输入框",
    "CMS 行列表",
    "蓝色选择边框",
    "结论标题",
    "双品牌标志"
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
      "timeSeconds": 2.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.5,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 9.5,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 13.791666666666666,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "键盘与输入框",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "输入任务",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "数据行批量变更",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "发布结论缩小",
      "end": 13.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.5,
      "label": "双品牌结束",
      "end": 15.958333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.958333,
  "fontFamily": "Arial, sans-serif"
}
```
