# Factory｜2.0 发布

先把软件生产拆成一组工序，再进入同样顺序的指标工作台。开场的工序词必须在后面的真实界面里找到对应。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 29.83346,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 18,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Factory",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f07438"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Factory",
        "accent": "#f07438"
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

## 工序串联开场素材

输入与输出固定在两端，计划、分诊、编写、测试、审查和交付置于中间。机械与颗粒纹理在标签下面快切，标签方向保持一致。

## 主张用粗字与短促错码

黑白底交替，橙色只点亮关键词或标志。错码只发生在字词入场的短瞬间，落定后必须读清，不让噪点持续覆盖正文。

```motion-demo
{
  "id": "clip-2",
  "title": "主张用粗字与短促错码",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "3–10 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从工序词进入可比较指标

工作台按阶段分列，先展示完整宽表，再推近两三个折线指标。游标出现时显示对应数值，结束拉回总览，保持各列顺序不变。

```motion-demo
{
  "id": "clip-3",
  "title": "从工序词进入可比较指标",
  "src": "demos/clip-3.html",
  "duration": 9,
  "status": "authored",
  "description": "16–25 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 更换业务时先重写工序

准备可对应的阶段名称、指标与结果。图表保留相同数据方向和单位，不把工序标签当作随机装饰；大片白底与深色控制台继续形成反差。

## 配色与字形

粗无衬线口号配等宽流程标签；数字与图表标签紧凑对齐。

#f4f3ef · #141414 · #f07438 · #9ebc9b · #929592

## 元素与制作规则

工序标签 / 机械拼贴 / 大字 / 斜线花标 / 流程列 / 折线图 / 游标

- 输入与输出固定在两端，计划、分诊、编写、测试、审查和交付置于中间。机械与颗粒纹理在标签下面快切，标签方向保持一致。
- 黑白底交替，橙色只点亮关键词或标志。错码只发生在字词入场的短瞬间，落定后必须读清，不让噪点持续覆盖正文。
- 工作台按阶段分列，先展示完整宽表，再推近两三个折线指标。游标出现时显示对应数值，结束拉回总览，保持各列顺序不变。
- 准备可对应的阶段名称、指标与结果。图表保留相同数据方向和单位，不把工序标签当作随机装饰；大片白底与深色控制台继续形成反差。

## 内容替换

- 替换生产流程与指标；保留工序词→工作台→局部指标→总览。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Factory",
  "id": "V185",
  "palette": [
    "#f4f3ef",
    "#141414",
    "#f07438",
    "#9ebc9b",
    "#929592"
  ],
  "typography": "粗无衬线口号配等宽流程标签；数字与图表标签紧凑对齐",
  "sample": "Factory",
  "objects": [
    "工序标签",
    "机械拼贴",
    "大字",
    "斜线花标",
    "流程列",
    "折线图",
    "游标"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/56ebecc96a99fc12cb7d934d2ff1ea1e4349e422629d0b4c20053f3316629df3",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e5db60fd5cebfe3d3b48af202af80aed43f11282928be7707d78113b9db1b5b3",
      "timeSeconds": 6.000025474860335,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 10.000042458100559,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 16.000067932960896,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 22.00009340782123,
      "frameId": "K0110",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 29.00012312849162,
      "frameId": "K0128",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "软件工序",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "主张快切",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "工序词接力",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "全流程可视化",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "工作台",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "阶段指标",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "图表细节",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "总览",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 29.83346,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 29.83346,
  "fontFamily": "Arial, sans-serif"
}
```
