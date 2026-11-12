# 标志聚合揭晓 · 8.0 秒

把旧图形拆成最小单元，再用同一组颜色重新组装标志与名称。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 8.01,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.9,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "slack",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2eb6d3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "slack",
        "accent": "#2eb6d3"
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

## 四个颜色始终保持身份

井号拆开后先成为分散圆点，再各自长出圆端条。位置和朝向按象限对应，颜色不在中途交换；完整图形出现后才展开名称。

```motion-demo
{
  "id": "clip-1",
  "title": "四个颜色始终保持身份",
  "src": "demos/clip-1.html",
  "duration": 2.6,
  "status": "authored",
  "description": "0.4–3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 标志先完成，名称接着站稳

名称碎片从图形右侧接入，完成后形成稳定横向锁定。白底、黑色粗无衬线与四色模块形成对比，名称字高与图形视觉高度接近。

## 换品牌时重写模块对应

适合能拆成少量几何模块的标志。替换颜色、模块和名称时仍保留拆解—重组的连续身份；收尾停留明显长于组装段。

## 配色与字形

无衬线粗字标；彩色圆端模块与黑色名称并排。

#fafafa · #050505 · #2eb6d3 · #2ca77a · #eab52c · #db1655

## 元素与制作规则

四色点 / 圆端条 / 品牌名称 / 组合标志

- 把旧图形拆成最小单元，再用同一组颜色重新组装标志与名称。
- 井号拆开后先成为分散圆点，再各自长出圆端条。位置和朝向按象限对应，颜色不在中途交换；完整图形出现后才展开名称。
- 名称碎片从图形右侧接入，完成后形成稳定横向锁定。白底、黑色粗无衬线与四色模块形成对比，名称字高与图形视觉高度接近。

## 内容替换

- 适合能拆成少量几何模块的标志。替换颜色、模块和名称时仍保留拆解—重组的连续身份；收尾停留明显长于组装段。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Slack",
  "id": "V367",
  "palette": [
    "#fafafa",
    "#050505",
    "#2eb6d3",
    "#2ca77a",
    "#eab52c",
    "#db1655"
  ],
  "typography": "无衬线粗字标；彩色圆端模块与黑色名称并排",
  "sample": "slack",
  "objects": [
    "四色点",
    "圆端条",
    "品牌名称",
    "组合标志"
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
      "timeSeconds": 0.6647302904564315,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.7615352697095437,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.658921161825726,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 2.991286307053942,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 7.877053941908714,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "旧井号",
      "end": 0.65,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.65,
      "label": "拆成四色点",
      "end": 1.75,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.75,
      "label": "模块长出",
      "end": 2.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.4,
      "label": "新标志",
      "end": 2.65,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.65,
      "label": "字母组装",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "完整字标",
      "end": 7.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.8,
      "label": "回到起点",
      "end": 8.01,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 8.01,
  "fontFamily": "Arial, sans-serif"
}
```
