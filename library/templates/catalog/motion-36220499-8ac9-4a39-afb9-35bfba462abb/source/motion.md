# 数字动效 · 6.1 秒

先用三个大数字连续倒计时，再拉开成为一套九宫格数字，展示同一家族的折线与圆角。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.116667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "3 2 1",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d9ff00"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "3 2 1",
        "accent": "#d9ff00"
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

## 倒计时同时换字与底色

3、2、1 分别使用紫、荧光黄、玫红底，黑色大数字占据中央。字符变化短促，停顿清晰，字形转折可以轻微折叠但不削弱数字辨认。

```motion-demo
{
  "id": "clip-1",
  "title": "倒计时同时换字与底色",
  "src": "demos/clip-1.html",
  "duration": 2.2,
  "status": "authored",
  "description": "0–2.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从单字变成数字家族

倒计时结束切黑底，白色数字按从左到右、从上到下补齐。格子中心不移动，内部轮廓逐步转成最终数字；最后放大 3 回到开头形成循环。

## 扩展字库保留同一转折逻辑

替换为章节编号或计数时，保持统一笔画宽、圆角和斜切角。网格最多九项，新字不挤占相邻格。

## 配色与字形

粗重自定义数字，圆角与折线结合；黑白强对比。

#6c1dff · #000000 · #d9ff00 · #ff0061 · #ffffff

## 元素与制作规则

倒计时数字 / 色彩底板 / 九宫格数字

- 3、2、1 分别使用紫、荧光黄、玫红底，黑色大数字占据中央。字符变化短促，停顿清晰，字形转折可以轻微折叠但不削弱数字辨认。
- 倒计时结束切黑底，白色数字按从左到右、从上到下补齐。格子中心不移动，内部轮廓逐步转成最终数字；最后放大 3 回到开头形成循环。
- 替换为章节编号或计数时，保持统一笔画宽、圆角和斜切角。网格最多九项，新字不挤占相邻格。

## 内容替换

- 替换倒计时和字库；保留单字→系列→回环。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Modyfi",
  "id": "V363",
  "palette": [
    "#6c1dff",
    "#000000",
    "#d9ff00",
    "#ff0061",
    "#ffffff"
  ],
  "typography": "粗重自定义数字，圆角与折线结合；黑白强对比",
  "sample": "3 2 1",
  "objects": [
    "倒计时数字",
    "色彩底板",
    "九宫格数字"
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
      "timeSeconds": 0.8333333333333334,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.6,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.25,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 5.5,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "三",
      "end": 0.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.8,
      "label": "二",
      "end": 1.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.6,
      "label": "一",
      "end": 2.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.2,
      "label": "数字网格逐项补全",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "返回三",
      "end": 6.116667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.116667,
  "fontFamily": "Arial, sans-serif"
}
```
