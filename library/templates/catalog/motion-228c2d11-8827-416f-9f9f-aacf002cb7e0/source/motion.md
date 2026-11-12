# https://t.co/OVuIhnRm6v → https://t.co/kyKWp8myFL https://t.co/DHPzoRv6Oh

以一句质疑开场，用一次现场操作制造反转，再回到原来的社交对话。整段只讲清一个问题，不旁逸到产品功能合集。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 37.041667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Look again!",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed3b99"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Look again!",
        "accent": "#ed3b99"
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

## 质疑、证明、回应

先让观众读懂社交贴文中的疑问，再把视线移到域名和地址栏。打开网站、提出问题、得到答复之后，回到原贴文补上回应。

## 屏幕取景只跟着阅读对象移动

社交贴文、地址栏、网站和回复各有自己的取景范围。推近时保留可辨认的窗口或页面边缘，让观众知道仍在同一个使用过程里。

黑白界面提供阅读底色，彩色部分留给品牌或网站内容。疑问句和最终回应可用较大字重，地址和输入文字保持常规界面尺寸。

## 把反转留在最后一句

网站出现后先留短暂辨认时间，再输入问题。答案中真正回应质疑的那一句要完整露出，随后再切回社交场景；提前露出最终回应会削弱反转。

```motion-demo
{
  "id": "clip-3",
  "title": "把反转留在最后一句",
  "src": "demos/clip-3.html",
  "duration": 12,
  "status": "authored",
  "description": "23–35 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 适合替换成哪类故事

选择一个可以现场澄清的误解，准备对应的操作与结果，并让最终回复直接回答开场。换品牌时检查网址、界面、问题和回帖是否说的是同一件事。

## 配色与字形

无衬线界面文字与清晰大小层级。

#101013 · #ffffff · #ed3b99 · #778df2 · #fb6740

## 元素与制作规则

社交贴文 / 取景窗口 / 地址栏 / 产品输入 / 回答 / 回帖

- 开头用质疑制造信息差，切到网站亲自验证，末尾回到原贴回应
- 同一屏幕局部平移放大，注意阅读对象而非对全屏等速缩放
- 网站替换发生在地址输入之后，回应依赖刚展示的事实

## 内容替换

- 可换为功能误解与现场验证，保留质疑→操作证明→回帖闭环
- 引用内容必须与最后回应对应

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Lovable",
  "id": "V042",
  "palette": [
    "#101013",
    "#ffffff",
    "#ed3b99",
    "#778df2",
    "#fb6740"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Look again!",
  "objects": [
    "社交贴文",
    "取景窗口",
    "地址栏",
    "产品输入",
    "回答",
    "回帖"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/49f90d57b14cf8c1753327a2f7858fca03bbdcf9abbdbfac397cff68aeb7e33a",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0054",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 23.0,
      "frameId": "K0092",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 29.0,
      "frameId": "K0108",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0131",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "社交质疑",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "推近域名",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "地址栏输入",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "新站点",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "用户提问",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "思考与回复",
      "end": 29.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29.0,
      "label": "回复关键句",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "回到社交回复",
      "end": 35.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35.0,
      "label": "品牌",
      "end": 37.041667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 37.041667,
  "fontFamily": "Arial, sans-serif"
}
```
