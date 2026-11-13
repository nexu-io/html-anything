# 在 Grok 里把草图变卡通

第一条请求把草图变成人物设定图，第二条再把该结果变为动画。聊天视图向上滚动，新结果从底部进入，保留上一条消息的联系。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.633333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "From sketch to cartoon",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#28a6d6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "From sketch to cartoon",
        "accent": "#28a6d6"
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

## 让两次请求沿同一条聊天线发生

第一条请求把草图变成人物设定图，第二条再把该结果变为动画。聊天视图向上滚动，新结果从底部进入，保留上一条消息的联系。

```motion-demo
{
  "id": "clip-1",
  "title": "让两次请求沿同一条聊天线发生",
  "src": "demos/clip-1.html",
  "duration": 2.8,
  "status": "authored",
  "description": "3.2–6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 保留角色一致，改变输出形态

草图、彩色人物表与动画预览应能认出同一组角色。蓝色气泡只表示用户输入，结果放浅色卡片，不混淆两种角色。

## 最后从内容回到服务标识

动画短暂播放后切到标志，再留网址。替换题材时先准备同一对象的草图、设定图和动作三个版本。

| 时间 | 段落 |
|---|---|
| 0.00–3.30s | 草图与输入 |
| 3.30–4.50s | 提交气泡 |
| 4.50–7.50s | 等待与人物设定图 |
| 7.50–10.70s | 要求转成视频 |
| 10.70–12.00s | 动画结果 |
| 12.00–15.50s | 双标志 |
| 15.50–17.63s | 网址 |

## 配色与字形

白色聊天界面、蓝色用户气泡、米色插画预览。。

#ffffff · #111111 · #28a6d6 · #eaf2f1 · #f3eed7

## 元素与制作规则

草图附件 / 用户消息 / 加载占位 / 人物设定图 / 视频结果

- 第一条请求把草图变成人物设定图，第二条再把该结果变为动画。聊天视图向上滚动，新结果从底部进入，保留上一条消息的联系。
- 草图、彩色人物表与动画预览应能认出同一组角色。蓝色气泡只表示用户输入，结果放浅色卡片，不混淆两种角色。
- 动画短暂播放后切到标志，再留网址。替换题材时先准备同一对象的草图、设定图和动作三个版本。

## 内容替换

- 换成目标角色与动画，维持连续两轮转换和聊天层级。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Krea",
  "id": "V128",
  "palette": [
    "#ffffff",
    "#111111",
    "#28a6d6",
    "#eaf2f1",
    "#f3eed7"
  ],
  "typography": "白色聊天界面、蓝色用户气泡、米色插画预览。",
  "sample": "From sketch to cartoon",
  "objects": [
    "草图附件",
    "用户消息",
    "加载占位",
    "人物设定图",
    "视频结果"
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
      "timeSeconds": 3.2605032679245283,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 4.724402694339623,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 10.812893490566038,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 11.977358943396228,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 15.836730158490568,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "草图与输入",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "提交气泡",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "等待与人物设定图",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "要求转成视频",
      "end": 10.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.7,
      "label": "动画结果",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "双标志",
      "end": 15.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.5,
      "label": "网址",
      "end": 17.633333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.633333,
  "fontFamily": "Arial, sans-serif"
}
```
