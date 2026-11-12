# Creative Cloud｜绿色立体变体

用不到两秒的同位置材质快切，把绿色有机形、景观和虹彩管道连接成同一个标志家族。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 1.375,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 0.69,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Organic Cloud",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#71cb32"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Organic Cloud",
        "accent": "#71cb32"
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

## 绿色块体与微景观共用轮廓

第一组保持柔软绿色质感和黑色孔洞，下一组沿同一弧线长出植物与小景。主体始终居中，外围装饰不改变标志总宽度。

## 结尾转成多色光滑管道

由绿色过渡到虹彩，球和棱锥只在周边点缀。白底保持干净，切换速度快但每帧都有完整剪影；新版本宜替换材质家族而非添加文案。

## 配色与字形

以标志轮廓与材质为主；文字只是拼贴或编辑辅助。

#ffffff · #142216 · #71cb32 · #f38dc1 · #abeb43

## 元素与制作规则

标志弧线 / 材质层 / 外围装饰 / 局部光泽 / 编辑线框

- 第一组保持柔软绿色质感和黑色孔洞，下一组沿同一弧线长出植物与小景。主体始终居中，外围装饰不改变标志总宽度。
- 由绿色过渡到虹彩，球和棱锥只在周边点缀。白底保持干净，切换速度快但每帧都有完整剪影；新版本宜替换材质家族而非添加文案。

## 内容替换

- 替换基础标志与风格素材组；保留相同重心、尺度与外围留白。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Adobe",
  "id": "V344",
  "palette": [
    "#ffffff",
    "#142216",
    "#71cb32",
    "#f38dc1",
    "#abeb43"
  ],
  "typography": "以标志轮廓与材质为主；文字只是拼贴或编辑辅助",
  "sample": "Organic Cloud",
  "objects": [
    "标志弧线",
    "材质层",
    "外围装饰",
    "局部光泽",
    "编辑线框"
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
      "timeSeconds": 0.4714285714285715,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/161aa5b6166c9e21ca19d2b2d9ddcdfec56175febf867d6ff8dfd27b7ad191dd",
      "timeSeconds": 0.7071428571428572,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 0.9821428571428572,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "绿色材质",
      "end": 0.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.45,
      "label": "结构与手套",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "花园",
      "end": 0.95,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.95,
      "label": "彩虹管道",
      "end": 1.375,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 1.375,
  "fontFamily": "Arial, sans-serif"
}
```
