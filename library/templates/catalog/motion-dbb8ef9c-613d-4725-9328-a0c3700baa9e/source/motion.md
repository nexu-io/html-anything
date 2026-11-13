# 玻璃棱镜上的 Framer

标题固定在画面中轴，按词逐步出现；狭长玻璃条从左向右延伸，最亮的光点稍后越过标题。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 3.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Welcome to a whole new Framer",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2788ff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Welcome to a whole new Framer",
        "accent": "#2788ff"
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

## 让高光带出一句话

标题固定在画面中轴，按词逐步出现；狭长玻璃条从左向右延伸，最亮的光点稍后越过标题。

```motion-demo
{
  "id": "clip-1",
  "title": "让高光带出一句话",
  "src": "demos/clip-1.html",
  "duration": 3.3,
  "status": "authored",
  "description": "0–3.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 高度克制，横向张力充足

玻璃条只占很窄的高度，黑底留白远大于主体。蓝色为主，青色和彩虹折边只作细线；文字不要随光带扭曲。

## 替换成一条发布短句

保留由左到右的阅读方向和最后的整句停留。中文可按短语分组出现，避免逐字挤满高光区域。

## 配色与字形

一行白色无衬线置于水平蓝色玻璃光带前方。。

#010714 · #ffffff · #2788ff · #3ee0ed · #223bc2

## 元素与制作规则

水平玻璃条 / 逐词标题 / 移动高光

- 标题固定在画面中轴，按词逐步出现；狭长玻璃条从左向右延伸，最亮的光点稍后越过标题。
- 玻璃条只占很窄的高度，黑底留白远大于主体。蓝色为主，青色和彩虹折边只作细线；文字不要随光带扭曲。
- 保留由左到右的阅读方向和最后的整句停留。中文可按短语分组出现，避免逐字挤满高光区域。

## 内容替换

- 更换发布短句和强调色，保留横向光带与逐词显现。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V338",
  "palette": [
    "#010714",
    "#ffffff",
    "#2788ff",
    "#3ee0ed",
    "#223bc2"
  ],
  "typography": "一行白色无衬线置于水平蓝色玻璃光带前方。",
  "sample": "Welcome to a whole new Framer",
  "objects": [
    "水平玻璃条",
    "逐词标题",
    "移动高光"
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
      "timeSeconds": 0.6666666666666666,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.8,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.6,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 3.466666666666667,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "句子开始",
      "end": 0.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.8,
      "label": "文字逐词出现",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "整句齐全",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "亮点越过文字",
      "end": 3.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.5,
      "label": "光带缩窄",
      "end": 3.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 3.866667,
  "fontFamily": "Arial, sans-serif"
}
```
