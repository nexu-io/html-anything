# Search On 2020｜制作方动效集锦 · 34.6 秒

把搜索的广度化成一组共享图形：标题阵列、点群、搜索框、语言胶囊和被高亮的结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 34.5345,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Search On",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4e8be3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Search On",
        "accent": "#4e8be3"
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

## 用少量图形建立统一语言

浅底和细线无衬线文字承托彩色点群。点表示内容单元，胶囊表示输入或类别，高亮表示当前命中；三种语义贯穿不同章节。

## 先展示覆盖，再进入使用

标题打字后复制成阵列，阵列让位给人物、地点和物品的点群。转入搜索符号与语言时，继续沿用相同中心和颜色。

```motion-demo
{
  "id": "clip-2",
  "title": "先展示覆盖，再进入使用",
  "src": "demos/clip-2.html",
  "duration": 20,
  "status": "authored",
  "description": "0–20 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 检索画面只强调当前命中

文档排成网格或列表，当前结果用彩色条和关键词强调，其他内容降低对比。镜头由结果集合推近一项，再进入查询或人物场景。

## 章节之间用同一个输入动作接续

长片由几个能力段组成，标题和光标反复出现，帮助观众重新定位。章节长度根据要读的文字决定，图形段更短，结果段留得更久。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 品牌 |
| 2.00–7.00s | 标题平铺 |
| 7.00–12.00s | 点群构形 |
| 12.00–14.00s | 搜索符号 |
| 14.00–20.00s | 语言胶囊 |
| 20.00–25.00s | 文档搜索 |
| 25.00–29.00s | Pinpoint 界面 |
| 29.00–31.00s | 搜索输入 |
| 31.00–34.53s | 人物段落 |

## 为新内容建立相同的图形语义

可换类别、语言和文档。先规定点、框和强调色分别代表什么，再填入素材；同一种高亮在全片保持同一个含义。

## 配色与字形

Google 原色点群、浅底胶囊与细线文字。

#f8faf9 · #416f9d · #4e8be3 · #df667d · #70bfa0

## 元素与制作规则

标题阵列 / 点群 / 搜索图标 / 语言胶囊 / 文档网格 / 高亮结果

- 点、胶囊、线构成共享原语，从抽象类别转为搜索结果。
- 彩色高亮只标识当前命中项，其余文档减弱。
- 章节以同一打字光标和短标题承接。

## 内容替换

- 换为知识工具时保留分类→检索→命中→查看的映射。
- 替换语言与文档，不改变高亮语义。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V016",
  "palette": [
    "#f8faf9",
    "#416f9d",
    "#4e8be3",
    "#df667d",
    "#70bfa0"
  ],
  "typography": "Google 原色点群、浅底胶囊与细线文字",
  "sample": "Search On",
  "objects": [
    "标题阵列",
    "点群",
    "搜索图标",
    "语言胶囊",
    "文档网格",
    "高亮结果"
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
      "timeSeconds": 7.007000000000001,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.012,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 20.02,
      "frameId": "K0075",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 25.025000000000002,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 30.997633333333333,
      "frameId": "K0121",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "品牌",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "标题平铺",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "点群构形",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "搜索符号",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "语言胶囊",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "文档搜索",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "Pinpoint 界面",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "搜索输入",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "人物段落",
      "end": 34.5345,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 34.5345,
  "fontFamily": "Arial, sans-serif"
}
```
