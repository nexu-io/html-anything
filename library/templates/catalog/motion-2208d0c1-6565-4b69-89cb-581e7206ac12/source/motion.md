# 紫框中的五个组件

固定紫色描边与组件名称，使五段快速演示看起来属于同一套工具。每次切换只更换内部对象，不移动展示舞台。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 3.9,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Component playground",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6554b5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Component playground",
        "accent": "#6554b5"
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

## 外框不动，连续换五种运动

固定紫色描边与组件名称，使五段快速演示看起来属于同一套工具。每次切换只更换内部对象，不移动展示舞台。

| 时间 | 段落 |
|---|---|
| 0.00–0.27s | 照片轮盘 |
| 0.27–1.00s | 旋转粒子球 |
| 1.00–2.00s | 图片跟随拖尾 |
| 2.00–3.00s | 纵向字词滚筒 |
| 3.00–3.90s | 图片磁吸网格 |

## 拖尾与滚筒用不同的运动规则

图片沿弧线依次追随并叠压；文字则围绕水平轴纵向滚动，中央清楚，上下逐渐模糊变小。两者不要共享同一种平移。

```motion-demo
{
  "id": "clip-2",
  "title": "拖尾与滚筒用不同的运动规则",
  "src": "demos/clip-2.html",
  "duration": 1.9,
  "status": "authored",
  "description": "1–2.9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用规整网格结束

最后把图片组织成连续上下滑动的圆角网格，较前面的散开状态更整齐。迁移时替换图片组与词库，保留五种机制的对比。

## 配色与字形

黑色展示区配细紫框；组件名称使用极小的紫色字。。

#000000 · #ffffff · #6554b5 · #2d79b0 · #d067ae

## 元素与制作规则

固定紫色画布边界 / 粒子球 / 图片拖尾 / 文字滚筒 / 磁吸网格

- 固定紫色描边与组件名称，使五段快速演示看起来属于同一套工具。每次切换只更换内部对象，不移动展示舞台。
- 图片沿弧线依次追随并叠压；文字则围绕水平轴纵向滚动，中央清楚，上下逐渐模糊变小。两者不要共享同一种平移。
- 最后把图片组织成连续上下滑动的圆角网格，较前面的散开状态更整齐。迁移时替换图片组与词库，保留五种机制的对比。

## 内容替换

- 可以替换图片与词组，但轮盘、球面、拖尾、滚筒、网格应保持不同拓扑。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V339",
  "palette": [
    "#000000",
    "#ffffff",
    "#6554b5",
    "#2d79b0",
    "#d067ae"
  ],
  "typography": "黑色展示区配细紫框；组件名称使用极小的紫色字。",
  "sample": "Component playground",
  "objects": [
    "固定紫色画布边界",
    "粒子球",
    "图片拖尾",
    "文字滚筒",
    "磁吸网格"
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
      "timeSeconds": 0.26666666666666666,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 1.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 2.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 3.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "照片轮盘",
      "end": 0.27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.27,
      "label": "旋转粒子球",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "图片跟随拖尾",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "纵向字词滚筒",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "图片磁吸网格",
      "end": 3.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 3.9,
  "fontFamily": "Arial, sans-serif"
}
```
