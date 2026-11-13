# 图标动效 · 10.3 秒

围绕同一个中心把符号连续改形，靠凹口、孔洞和分块改变含义，而不是让不同图标逐个淡入。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.266667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Shape vocabulary",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ffffff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Shape vocabulary",
        "accent": "#ffffff"
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

## 形变前后保留重心

闪电、折角和对话形使用相近面积。先移动外轮廓的转折点，再让新形状短暂停留；圆角半径保持相近，避免中途出现尖锐毛刺。

```motion-demo
{
  "id": "clip-1",
  "title": "形变前后保留重心",
  "src": "demos/clip-1.html",
  "duration": 3.0999999999999996,
  "status": "authored",
  "description": "1.7–4.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 孔洞与分块有独立动作

眼形先压扁再张开，中心孔跟随高度变化；转到地球后，白色区域之间用黑色间隙区分经纬块。全程黑底白形，新符号也应有清楚的剪影。

## 迁移时按轮廓相近程度排序

选择相邻形状可以共享转折点的符号，提前决定中心孔何时出现、何时闭合。最多保留五至六种形状，给每个符号一个能辨认的停顿。

## 配色与字形

主体为圆角矢量形；不依赖正文，负空间保持清晰。

#000000 · #ffffff · #ffffff · #888888

## 元素与制作规则

连续外轮廓 / 凹口 / 眼形孔洞 / 地球分块

- 闪电、折角和对话形使用相近面积。先移动外轮廓的转折点，再让新形状短暂停留；圆角半径保持相近，避免中途出现尖锐毛刺。
- 眼形先压扁再张开，中心孔跟随高度变化；转到地球后，白色区域之间用黑色间隙区分经纬块。全程黑底白形，新符号也应有清楚的剪影。
- 选择相邻形状可以共享转折点的符号，提前决定中心孔何时出现、何时闭合。最多保留五至六种形状，给每个符号一个能辨认的停顿。

## 内容替换

- 替换同面积的符号序列；保留重心、圆角与负空间的连续变化。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Modyfi",
  "id": "V362",
  "palette": [
    "#000000",
    "#ffffff",
    "#ffffff",
    "#888888"
  ],
  "typography": "主体为圆角矢量形；不依赖正文，负空间保持清晰",
  "sample": "Shape vocabulary",
  "objects": [
    "连续外轮廓",
    "凹口",
    "眼形孔洞",
    "地球分块"
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
      "timeSeconds": 2.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "闪电展开",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "折角形变",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "对话形",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "眼形眨动",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "地球分块",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "缩回",
      "end": 10.266667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.266667,
  "fontFamily": "Arial, sans-serif"
}
```
