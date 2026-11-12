# Comet｜一排星球

用一条横向星球队列做可聚焦的浏览。队列平移、球体自转和焦点放大彼此独立，背景保持安静。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 15.2,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Comet planets",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#347c89"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Comet planets",
        "accent": "#347c89"
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

## 让对象沿同一条轴排列

球体围绕同一水平中线排列，尺寸略有不同，两侧对象可以被视口自然裁切。顶部导航、角落图块与细轨道固定在背景层，不随队列同速移动。

暖白底、深青文字与低饱和背景形成留白，球面纹理承担主要色彩。对象名称用短小清楚的字形，次级入口比名称更轻。

## 焦点变化不等于队列停摆

队列向侧边滑动时，各球体继续缓慢自转。进入焦点区域的对象轻微放大，名称和入口随后浮现；离开焦点时文字先退，尺寸再回到常态。

避免所有球体同时弹跳或同时出现名称。大幅动作只给队列换位，小幅动作留给旋转和焦点反馈。

## 循环与内容替换

末段沿合理方向回到初始排列，保持间距与运动速度衔接。替换为产品、专辑或功能集合时，为每项准备独立外观与名称，保留稳定背景、移动队列和单一焦点。

## 配色与字形

无衬线界面文字与清晰大小层级。

#faf8ef · #172b2c · #347c89 · #c86931 · #90754b

## 元素与制作规则

顶部导航 / 星球队列 / 活动星球 / 名称与入口 / 背景圆角图块 / 细轨道

- 球体沿同一水平轴滑动，视口裁剪两侧，活动球体轻微放大并出现文字
- 球面纹理持续旋转，队列平移与自转是独立运动
- 末段回到原队列位置，形成可循环浏览

## 内容替换

- 可迁移为多产品浏览，保留对象队列、焦点状态、名称与入口
- 纹理可替换成产品外观，静态背景不随队列同速移动

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V077",
  "palette": [
    "#faf8ef",
    "#172b2c",
    "#347c89",
    "#c86931",
    "#90754b"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Comet planets",
  "objects": [
    "顶部导航",
    "星球队列",
    "活动星球",
    "名称与入口",
    "背景圆角图块",
    "细轨道"
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
      "frameId": "K0002",
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
      "timeSeconds": 9.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0029",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 14.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "星球横排",
      "end": 1.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.0,
      "label": "聚焦首对象",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "队列向左",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "聚焦木星",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "聚焦土星",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "队列回移",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "回到初态",
      "end": 15.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 15.2,
  "fontFamily": "Arial, sans-serif"
}
```
