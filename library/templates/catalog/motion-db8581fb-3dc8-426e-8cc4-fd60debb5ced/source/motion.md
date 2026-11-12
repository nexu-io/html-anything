# Le Chat 新功能

用统一的像素符号串起研究、项目、语音和图像编辑。每个功能都有短主张和一个具体使用片段。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 113.766667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Le Chat",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ee5a25"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Le Chat",
        "accent": "#ee5a25"
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

## 让像素语汇贯穿明暗主题

红、橙、黄像素块用于标志、箭头、转场和强调。米白段适合研究与整理，黑底段承接语音和生活场景；文字以清楚无衬线为主。

## 研究结果继续进入项目

先输入研究问题，过程卡逐步增加内容，结果完成后接到项目分组。用卡片移动表达归档，保留主题和关键数据。

```motion-demo
{
  "id": "clip-2",
  "title": "研究结果继续进入项目",
  "src": "demos/clip-2.html",
  "duration": 32,
  "status": "authored",
  "description": "13–45 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 语音段改变画面的密度

用像素符号和短句打开深色段，随后给手机与波形。生活镜头铺满背景，输入框和少量文字浮在前面，每个场景只讲一种用途。

![57.00s · 构图参考](assets/reference-4.jpg)

## 修改图片时保留同一主体

先展示生成的图片，再输入具体改动，再给新结果。人物、构图或主要物件维持连续，变化集中在刚才提出的要求上。

## 功能章节之间如何衔接

章节标题短，使用片段长；重复使用像素箭头和色带作为过渡。片尾收回品牌标志和入口，让不同功能归到同一产品。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 发布标题 |
| 7.00–13.00s | 能力短句 |
| 13.00–20.00s | 研究请求 |
| 20.00–29.00s | 研究结果 |
| 29.00–45.00s | 项目归档 |
| 45.00–57.00s | 深色主题 |
| 57.00–68.00s | 语音命令 |
| 68.00–80.00s | 生活场景 |
| 80.00–92.00s | 购物问答 |
| 92.00–104.00s | 图像编辑 |
| 104.00–113.77s | 品牌 |

## 换成另一轮产品更新

替换功能清单、请求和成果素材。保留像素语言、明暗分组和每章一项实际用途；功能减少时直接删除整章，而不是把余下章节拉长。

## 配色与字形

米白与黑底切换、红橙黄像素符号、产品卡与生活镜头。

#fffbed · #222222 · #ee5a25 · #ffc800 · #a50000

## 元素与制作规则

像素标志 / 研究卡 / 项目分组 / 手机语音 / 生活场景 / 商品结果 / 图像编辑卡

- 每章用像素符号和短句开场，再用一个产品动作举例。
- 研究→项目整理后切到语音与生活应用，明暗主题帮助分组。
- 图片修改必须延续同一主体，结果作为证据出现。

## 内容替换

- 可用于多功能版本发布；保留统一像素语汇和每章一项证据。
- 商品图片、人物与音频需替换资源。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Mistral",
  "id": "V035",
  "palette": [
    "#fffbed",
    "#222222",
    "#ee5a25",
    "#ffc800",
    "#a50000"
  ],
  "typography": "米白与黑底切换、红橙黄像素符号、产品卡与生活镜头",
  "sample": "Le Chat",
  "objects": [
    "像素标志",
    "研究卡",
    "项目分组",
    "手机语音",
    "生活场景",
    "商品结果",
    "图像编辑卡"
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
      "timeSeconds": 13.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 29.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 57.0,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 80.0,
      "frameId": "K0189",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 104.0,
      "frameId": "K0264",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "发布标题",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "能力短句",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "研究请求",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "研究结果",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "项目归档",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "深色主题",
      "end": 57,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 57,
      "label": "语音命令",
      "end": 68,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 68,
      "label": "生活场景",
      "end": 80,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 80,
      "label": "购物问答",
      "end": 92,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 92,
      "label": "图像编辑",
      "end": 104,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 104,
      "label": "品牌",
      "end": 113.766667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 113.766667,
  "fontFamily": "Arial, sans-serif"
}
```
