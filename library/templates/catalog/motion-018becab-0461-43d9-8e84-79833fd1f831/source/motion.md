# 新产品新视觉

纹章、短句和链接保持居中，页面四角保留少量导航。蓝色光标划弧经过留白，再回到中心文字，形成单一的动态焦点。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 22.466667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 16.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "The Browser Company",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4c6be2"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "The Browser Company",
        "accent": "#4c6be2"
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

## 让安静网页成为光标的背景

纹章、短句和链接保持居中，页面四角保留少量导航。蓝色光标划弧经过留白，再回到中心文字，形成单一的动态焦点。

```motion-demo
{
  "id": "clip-1",
  "title": "让安静网页成为光标的背景",
  "src": "demos/clip-1.html",
  "duration": 3,
  "status": "authored",
  "description": "5–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 光标增加，信息位置不变

从一条弧线增加到多个短尾迹，随后切换深色主题。只翻转底色与文字对比，不重新排版，让读者认出是同一张页面。

## 更换身份文案仍保留留白

可以替换公司纹章、两行理念与导航。细衬线主句和较小等宽导航区分语气，光标路径避免长时间遮住标题。

## 配色与字形

奶白网页、细衬线斜体主句、蓝色光标拖尾，外侧柔焦桌面。。

#eeeeE7 · #252525 · #4c6be2 · #b2adae · #47434f

## 元素与制作规则

浏览器窗 / 中央纹章 / 衬线短句 / 蓝色光标尾迹 / 主题切换

- 纹章、短句和链接保持居中，页面四角保留少量导航。蓝色光标划弧经过留白，再回到中心文字，形成单一的动态焦点。
- 从一条弧线增加到多个短尾迹，随后切换深色主题。只翻转底色与文字对比，不重新排版，让读者认出是同一张页面。
- 可以替换公司纹章、两行理念与导航。细衬线主句和较小等宽导航区分语气，光标路径避免长时间遮住标题。

## 内容替换

- 使用目标公司的纹章与理念，保留静态排版和动态光标。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "The Browser Company",
  "id": "V136",
  "palette": [
    "#eeeeE7",
    "#252525",
    "#4c6be2",
    "#b2adae",
    "#47434f"
  ],
  "typography": "奶白网页、细衬线斜体主句、蓝色光标拖尾，外侧柔焦桌面。",
  "sample": "The Browser Company",
  "objects": [
    "浏览器窗",
    "中央纹章",
    "衬线短句",
    "蓝色光标尾迹",
    "主题切换"
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
      "timeSeconds": 3.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 13.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 16.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 19.6,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "网页标识显现",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "居中文字",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "单光标轨迹",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "推近网页",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "多光标散布",
      "end": 19.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.6,
      "label": "切换深色主题",
      "end": 22.466667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 22.466667,
  "fontFamily": "Georgia, serif"
}
```
