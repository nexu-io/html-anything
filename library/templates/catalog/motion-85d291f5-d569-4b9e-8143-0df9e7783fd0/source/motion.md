# 导入项目和网站

用一条横向网站队列说明“这些来源都能导入”。输入栏保持在前景，让每个来源都有自己的导入命令。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.666667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Import your project",
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
        "title": "Import your project",
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

## 移动来源，固定操作入口

网站视窗沿水平方向切换，前景视窗清晰，左右邻项只露出一部分。底部输入条固定在同一位置；网站变化时，观众不用重新寻找操作入口。

## 一站点，一条命令

当前站点稳定后开始写入对应的导入文本。命令足以辨认来源后再切下一站，离场时同步清空或替换输入内容；不要让上一站的命令留在新站点上。

网站可以有完全不同的视觉风格，输入条、字体和按钮却保持一致。暗色背景与柔光承托队列，前景输入用高对比文字。

## 把末尾接回起点

最后一个来源结束后，将队列接回第一个网站，恢复开场输入状态。循环连接处保持移动方向、视窗大小和前景层次一致。

迁移时按“来源页面＋来源类型＋导入命令”成组替换。可改为设计文件、仓库或多工具导入，保留稳定入口和变化来源。

## 配色与字形

无衬线界面文字与清晰大小层级。

#101013 · #ffffff · #ed3b99 · #778df2 · #fb6740

## 元素与制作规则

横向网站队列 / 前景网站 / 底部输入条 / 导入文案

- 前景网站按水平队列切换，底部输入位置保持稳定
- 每个网站对应不同来源的导入命令；命令在该网站停留期间逐步写出
- 尾部重新出现第一网站，形成演示循环

## 内容替换

- 可换为多格式导入或多工具连接；维持固定操作条和不同来源对应
- 每个网站保持约一段读写时间，不把全段堆成一屏

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Lovable",
  "id": "V043",
  "palette": [
    "#101013",
    "#ffffff",
    "#ed3b99",
    "#778df2",
    "#fb6740"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Import your project",
  "objects": [
    "横向网站队列",
    "前景网站",
    "底部输入条",
    "导入文案"
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
      "timeSeconds": 1.0,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 2.533333333333333,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 5.833333333333333,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/cd1e9d570580c2439b9b9e822cebefbb1d43fa7fb4f9a25a9442e1c9e45f74ae",
      "timeSeconds": 8.466666666666667,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/b78f52cb4e07795feaaa619728ec28eb42dfde46ae38a58d76f4457ae73b95ae",
      "timeSeconds": 11.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "作品网站",
      "end": 1.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.0,
      "label": "输入导入请求",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "第二网站",
      "end": 5.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.8,
      "label": "代码仓库",
      "end": 8.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.6,
      "label": "电商网站",
      "end": 11.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.1,
      "label": "回到首网站",
      "end": 11.666667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.666667,
  "fontFamily": "Arial, sans-serif"
}
```
