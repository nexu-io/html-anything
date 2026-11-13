# Cloudera｜品牌图形短片

把企业数据的疑问放进一段有起点、障碍和汇流的旅程，最终用同一队角色走向共同目的地。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 29.917667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 21.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Your journey to enterprise AI",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d5ff26"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Your journey to enterprise AI",
        "accent": "#d5ff26"
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

## 问题段降低视觉密度

开场地图与角色建立旅行语境，随后切黑色星空，一次只出现一个问题。白色无衬线短句居中，细箭头带向下一句，角色和地图暂时让出阅读空间。

## 绿色道路贯穿镜头变化

多条支路汇入主干，人物沿道路前进；云层和山脉先作前景遮挡再移开，视角从近地拉到远景后再次推进。亮绿路面、蓝粉侧带与细黑轮廓保持一致。

```motion-demo
{
  "id": "clip-2",
  "title": "绿色道路贯穿镜头变化",
  "src": "demos/clip-2.html",
  "duration": 6.5,
  "status": "authored",
  "description": "15.5–22 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用角色抵达承接品牌承诺

橙色圆头从云间出现后承担结论，Trust your data 在前景云层上展开，最后整屏品牌橙收尾。地图用纸白底，星空用纯黑，品牌页用高饱和橙，三个环境切换清楚。

## 替换问题与目的地，保留一条路

新主题需准备开场主张、三项问题与最终承诺。人物颜色可以换，但要持续出现在同一旅程里；避免每一段都换完全无关的插画。

## 配色与字形

无衬线两行短句；手绘黑轮廓、轻微不规则边缘与大块亮色。

#eeebe7 · #121212 · #d5ff26 · #49aeec · #e174df · #f16a09

## 元素与制作规则

绿色道路 / 彩色圆头角色 / 云与山 / 星空问题页 / 电脑火箭 / 橙色主角

- 把企业数据的疑问放进一段有起点、障碍和汇流的旅程，最终用同一队角色走向共同目的地。
- 开场地图与角色建立旅行语境，随后切黑色星空，一次只出现一个问题。白色无衬线短句居中，细箭头带向下一句，角色和地图暂时让出阅读空间。
- 多条支路汇入主干，人物沿道路前进；云层和山脉先作前景遮挡再移开，视角从近地拉到远景后再次推进。亮绿路面、蓝粉侧带与细黑轮廓保持一致。

## 内容替换

- 新主题需准备开场主张、三项问题与最终承诺。人物颜色可以换，但要持续出现在同一旅程里；避免每一段都换完全无关的插画。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cloudera",
  "id": "V376",
  "palette": [
    "#eeebe7",
    "#121212",
    "#d5ff26",
    "#49aeec",
    "#e174df",
    "#f16a09"
  ],
  "typography": "无衬线两行短句；手绘黑轮廓、轻微不规则边缘与大块亮色",
  "sample": "Your journey to enterprise AI",
  "objects": [
    "绿色道路",
    "彩色圆头角色",
    "云与山",
    "星空问题页",
    "电脑火箭",
    "橙色主角"
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
      "timeSeconds": 6.574396847473342,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.987783031988872,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 15.478959666203059,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 20.97149374130737,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 26.96334909596662,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "单个角色",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "旅程主张",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "地图与绿色道路",
      "end": 6.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.6,
      "label": "进入星空",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "成本问题",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "安全问题",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "数据问题",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "电脑里的火箭",
      "end": 15.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.5,
      "label": "道路汇流",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "穿越云层",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "角色队列",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "橙色角色",
      "end": 24.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.8,
      "label": "Trust your data",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "品牌橙底",
      "end": 29.917667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 29.917667,
  "fontFamily": "Arial, sans-serif"
}
```
