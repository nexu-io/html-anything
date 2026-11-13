# Framer Skills

开场在输入框中接连输入字体和引号规则；接着展示已完成页面，使观众知道这些规则影响的是整套页面。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 29.996633,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 20,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "/skills",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#168fe0"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "/skills",
        "accent": "#168fe0"
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

## 先展示重复工作，再给快捷入口

开场在输入框中接连输入字体和引号规则；接着展示已完成页面，使观众知道这些规则影响的是整套页面。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 反复输入规则 |
| 5.00–12.00s | 页面细节巡览 |
| 12.00–17.00s | 调用设计技能 |
| 17.00–25.30s | 同风格新页面 |
| 25.30–29.00s | 命令标签 |
| 29.00–30.00s | 标志 |

## 让蓝色边框串起旧页与新页

横向排列多个暗色网页，中央页面较大且带细蓝边。镜头沿内容上下移动；调用 /design-system 后，新页面沿用同一边框和文字层级。

```motion-demo
{
  "id": "clip-2",
  "title": "让蓝色边框串起旧页与新页",
  "src": "demos/clip-2.html",
  "duration": 5,
  "status": "authored",
  "description": "17–22 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 将命令收成可记住的符号

结尾放大 /skills 标签，以蓝色圆角描边和短促发光取代复杂界面。正文用中等字重，页面小字保持克制。

## 迁移时换规则内容，不换因果顺序

更换被复用的品牌规范、命令名与网页内容。保留“重复约束—调用技能—一致结果”的前后对比。

## 配色与字形

暗色编辑器配白色无衬线；命令片段用亮蓝底或蓝色辉光。。

#080808 · #f7f7f7 · #168fe0 · #202020 · #727272

## 元素与制作规则

输入框 / 多页横向画廊 / 蓝色选中画布 / 命令标签

- 开场在输入框中接连输入字体和引号规则；接着展示已完成页面，使观众知道这些规则影响的是整套页面。
- 横向排列多个暗色网页，中央页面较大且带细蓝边。镜头沿内容上下移动；调用 /design-system 后，新页面沿用同一边框和文字层级。
- 结尾放大 /skills 标签，以蓝色圆角描边和短促发光取代复杂界面。正文用中等字重，页面小字保持克制。

## 内容替换

- 换成其他技能和产物，维持输入约束与输出外观的对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V272",
  "palette": [
    "#080808",
    "#f7f7f7",
    "#168fe0",
    "#202020",
    "#727272"
  ],
  "typography": "暗色编辑器配白色无衬线；命令片段用亮蓝底或蓝色辉光。",
  "sample": "/skills",
  "objects": [
    "输入框",
    "多页横向画廊",
    "蓝色选中画布",
    "命令标签"
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
      "timeSeconds": 5.005,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.012,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 17.017,
      "frameId": "K0062",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 25.291933333333333,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 29.029,
      "frameId": "K0107",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "反复输入规则",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "页面细节巡览",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "调用设计技能",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "同风格新页面",
      "end": 25.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.3,
      "label": "命令标签",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "标志",
      "end": 29.996633,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 29.996633,
  "fontFamily": "Arial, sans-serif"
}
```
