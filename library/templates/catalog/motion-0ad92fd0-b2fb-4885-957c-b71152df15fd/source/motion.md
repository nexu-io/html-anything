# Dia 开放给 Arc 会员

发光图形从底部升起并缩小，随后变为发送箭头；输入框沿水平方向展开，让品牌介绍自然进入操作。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.016667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Chat with your tabs",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f3a264"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Chat with your tabs",
        "accent": "#f3a264"
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

## 同一个形状从品牌变成工具

发光图形从底部升起并缩小，随后变为发送箭头；输入框沿水平方向展开，让品牌介绍自然进入操作。

```motion-demo
{
  "id": "clip-1",
  "title": "同一个形状从品牌变成工具",
  "src": "demos/clip-1.html",
  "duration": 6.5,
  "status": "authored",
  "description": "3–9.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 背景有方向，输入区保持稳定

橙色光束从上方汇聚点向下放射，蓝色承担暗部；半透明白面板固定在下半部。正文黑字，品牌小字可用细衬线。

## 三个例子共用引用与回答结构

视频、商品和邮件分别作为引用标签进入输入框，提交后回答在上方展开。替换主题时更换引用内容与任务，维持输入区位置和结果方向。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 放射光与片头 |
| 3.00–7.00s | Dia 图形升起 |
| 7.00–8.50s | 变成发送按钮 |
| 8.50–10.50s | 输入条展开 |
| 10.50–13.50s | 解释视频 |
| 13.50–17.00s | 对比商品 |
| 17.00–21.00s | 改写文本 |
| 21.00–24.02s | 欢迎窗口 |

## 配色与字形

蓝橙放射光背景，磨砂白色输入栏，品牌名用细衬线。。

#08132a · #ffffff · #f3a264 · #3169a5 · #c8cad9

## 元素与制作规则

放射光 / Dia 图形 / 输入框 / 引用标签 / 回答条带 / 欢迎窗

- 发光图形从底部升起并缩小，随后变为发送箭头；输入框沿水平方向展开，让品牌介绍自然进入操作。
- 橙色光束从上方汇聚点向下放射，蓝色承担暗部；半透明白面板固定在下半部。正文黑字，品牌小字可用细衬线。
- 视频、商品和邮件分别作为引用标签进入输入框，提交后回答在上方展开。替换主题时更换引用内容与任务，维持输入区位置和结果方向。

## 内容替换

- 保留品牌变输入控件、引用素材再回答的连续关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "The Browser Company",
  "id": "V135",
  "palette": [
    "#08132a",
    "#ffffff",
    "#f3a264",
    "#3169a5",
    "#c8cad9"
  ],
  "typography": "蓝橙放射光背景，磨砂白色输入栏，品牌名用细衬线。",
  "sample": "Chat with your tabs",
  "objects": [
    "放射光",
    "Dia 图形",
    "输入框",
    "引用标签",
    "回答条带",
    "欢迎窗"
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
      "timeSeconds": 3.0041695621959694,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 8.828920546675933,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 10.397764651378273,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 17.023627519110494,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 21.029186935371786,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "放射光与片头",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "Dia 图形升起",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "变成发送按钮",
      "end": 8.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.5,
      "label": "输入条展开",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "解释视频",
      "end": 13.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.5,
      "label": "对比商品",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "改写文本",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "欢迎窗口",
      "end": 24.016667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.016667,
  "fontFamily": "Georgia, serif"
}
```
