# 适配 iPhone Duo

用折叠设备从窄屏变宽屏，演示工作区如何重新分配空间。内容重新排版，侧栏与正文各自保留行为。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 8.633333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Company Home",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Company Home",
        "accent": "#2f91cb"
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

## 展开时增加空间，而不是拉伸文字

设备边界逐渐变宽，正文获得更大的可视区域。侧栏作为固定导航出现，正文按宽度重新排版；文字字号和图标比例保持稳定。

```motion-demo
{
  "id": "clip-1",
  "title": "展开时增加空间，而不是拉伸文字",
  "src": "demos/clip-1.html",
  "duration": 3,
  "status": "authored",
  "description": "0–3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 滚动与键盘只影响相关区域

正文滚动时侧栏不跟着移动。聚焦文本后再出现键盘，下方内容随可用高度调整，输入光标留在可见范围；设备外框继续作为稳定参照。

## 把层级做在裁切和排版里

浅色界面、深色无衬线正文与细分隔线即可建立工作区。侧栏文字密度低于正文，设备边界和内容裁切范围分别控制；柔和蓝、杏和紫色只承担次级强调。

## 换工作区内容，保留响应方式

可以更换公司主页、笔记或项目文档。使用有长短段落差异的内容，让展开后的重新排版清楚可见；键盘出现的时机要对应真实的输入焦点。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

折叠设备 / 侧栏 / 正文 / 光标 / 软键盘

- 展开后增加正文可视面积，侧栏与正文有父子裁切关系。
- 滚动仅影响正文；末尾键盘遮挡下部并压缩阅读区域。

## 内容替换

- 可换工作区内容；保留窄屏→宽屏布局重排，不把内容横向拉伸。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V090",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Company Home",
  "objects": [
    "折叠设备",
    "侧栏",
    "正文",
    "光标",
    "软键盘"
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
      "timeSeconds": 0.7666666666666667,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 1.6666666666666667,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 3.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/8334a96be693eaf4194a8a6b918b552f41171a1f01a41d2ba15704a17ba0c5cb",
      "timeSeconds": 6.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 7.9,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "手机窄屏",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "设备展开",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "双栏内容",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "滚动正文",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "定位文本",
      "end": 7.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.8,
      "label": "键盘出现",
      "end": 8.633333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 8.633333,
  "fontFamily": "Arial, sans-serif"
}
```
