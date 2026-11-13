# Bolt Forge｜产品发布

用两轮具体需求证明制作范围：提示词先完整出现，随后进入可滚动的网页结果，最后把多个作品展开为空间拼图。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.52,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Bolt Forge",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#279de5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Bolt Forge",
        "accent": "#279de5"
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

## 蓝色背景保持，作品风格可以变化

用浅蓝光晕承托白色输入框和浏览器，背景慢速漂移。产品字标与界面文字保持简洁无衬线，商店与作品集可拥有不同配色。

## 每轮先输入再展示可用页面

先选择模式，输入具体网站需求，再推近提交按钮。结果页从整体进入，随后沿纵向滚动展示更多内容，发布按钮形成这一轮的完成信号。

```motion-demo
{
  "id": "clip-2",
  "title": "每轮先输入再展示可用页面",
  "src": "demos/clip-2.html",
  "duration": 8,
  "status": "authored",
  "description": "8–16 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 两次案例后再展开作品范围

第二轮复用相同的输入节奏但切换内容类型。结尾把多个网页缩小到同一空间，扩大产能印象，再留白收回产品名。

## 主题迁移要同时替换请求和结果

准备两个差异明显的案例，如商店与作品集。输入文案、结果标题、商品或项目内容必须相互对应，不只换左上角标志。

## 配色与字形

无衬线短句搭配产品字标；结果网页保留各自标题风格。

#bce8fb · #122331 · #279de5 · #ffffff · #154be6

## 元素与制作规则

蓝色柔焦场 / 模型菜单 / 提示框 / 商店页面 / 作品集页面 / 发布按钮 / 作品拼图

- 用浅蓝光晕承托白色输入框和浏览器，背景慢速漂移。产品字标与界面文字保持简洁无衬线，商店与作品集可拥有不同配色。
- 先选择模式，输入具体网站需求，再推近提交按钮。结果页从整体进入，随后沿纵向滚动展示更多内容，发布按钮形成这一轮的完成信号。
- 第二轮复用相同的输入节奏但切换内容类型。结尾把多个网页缩小到同一空间，扩大产能印象，再留白收回产品名。
- 准备两个差异明显的案例，如商店与作品集。输入文案、结果标题、商品或项目内容必须相互对应，不只换左上角标志。

## 内容替换

- 替换两轮任务和结果页面；保留输入、生成、浏览、发布。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Bolt",
  "id": "V372",
  "palette": [
    "#bce8fb",
    "#122331",
    "#279de5",
    "#ffffff",
    "#154be6"
  ],
  "typography": "无衬线短句搭配产品字标；结果网页保留各自标题风格",
  "sample": "Bolt Forge",
  "objects": [
    "蓝色柔焦场",
    "模型菜单",
    "提示框",
    "商店页面",
    "作品集页面",
    "发布按钮",
    "作品拼图"
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
      "timeSeconds": 6.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 11.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 17.0,
      "frameId": "K0060",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 26.0,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 35.0,
      "frameId": "K0126",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "蓝色柔焦标题",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "产品名与容量",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "模式选择",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "商店需求输入",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "商店生成",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "发布",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "作品集需求",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "作品集结果",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "开放式请求",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "作品空间",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "品牌",
      "end": 36.52,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.52,
  "fontFamily": "Arial, sans-serif"
}
```
