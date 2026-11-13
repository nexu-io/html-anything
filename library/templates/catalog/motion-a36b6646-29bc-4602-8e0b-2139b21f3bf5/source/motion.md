# Own the means of production. Revolt with us.

把极近的标志与红字快速拉回到小尺度组合；黑场留下大量空白，完成一次短促品牌亮相。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 2.6,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Sovereign",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e6252a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Sovereign",
        "accent": "#e6252a"
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

## 先超出画幅，再落回中心

开始让环与文字局部大于画面，边缘带模糊拖尾。拉远时图标、横线与字标成为一个整体，最终宽度只占画面约四分之一。

```motion-demo
{
  "id": "clip-1",
  "title": "先超出画幅，再落回中心",
  "src": "demos/clip-1.html",
  "duration": 1.35,
  "status": "authored",
  "description": "0–1.35 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 黑底只保留两种信息色

环形图标为白色，字标为红色；拖尾沿运动轴展开，停稳后消退。字号变化比横移更强，收尾留出辨认名称的静止时间。

## 替换时保留短词结构

适合单个标志加一至两个词的名称。长标题先另做短品牌名，不在这段两秒多的亮相里塞入副标题。

## 配色与字形

高对比无衬线字，极大裁切字转为很小的最终字标。

#000000 · #ffffff · #e6252a · #777777

## 元素与制作规则

白色环形标 / 红色字标 / 拖尾颗粒

- 开始让环与文字局部大于画面，边缘带模糊拖尾。拉远时图标、横线与字标成为一个整体，最终宽度只占画面约四分之一。
- 环形图标为白色，字标为红色；拖尾沿运动轴展开，停稳后消退。字号变化比横移更强，收尾留出辨认名称的静止时间。
- 适合单个标志加一至两个词的名称。长标题先另做短品牌名，不在这段两秒多的亮相里塞入副标题。

## 内容替换

- 替换单个标志与短品牌词；保留近景→拉远锁定。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Palantir",
  "id": "V166",
  "palette": [
    "#000000",
    "#ffffff",
    "#e6252a",
    "#777777"
  ],
  "typography": "高对比无衬线字，极大裁切字转为很小的最终字标",
  "sample": "Sovereign",
  "objects": [
    "白色环形标",
    "红色字标",
    "拖尾颗粒"
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
      "path": "https://r.open-design.ai/files/3f4a46aa43d8b3093cb57737f814d8ef354f4bcacdc32c64a84a3cda7f3d51c8",
      "timeSeconds": 0.25,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0ab64d6b0f5818555fa1a34ee1b80322f97ef8d858342d05b94fcc5b04d9e9be",
      "timeSeconds": 0.75,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 1.25,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "模糊标志",
      "end": 0.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.3,
      "label": "横向拖尾",
      "end": 0.65,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.65,
      "label": "红字特写",
      "end": 1.22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.22,
      "label": "缩小锁定",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 2.6,
  "fontFamily": "Arial, sans-serif"
}
```
