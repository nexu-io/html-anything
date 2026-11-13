# Ramp · 官网产品展示

从一张支付卡展开相关业务，再推进到账单与报表界面，让同一笔消费在不同视图里连起来。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 13.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Ramp",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d8f646"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Ramp",
        "accent": "#d8f646"
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

## 让实体卡成为空间锚点

暖白底上先放黑色卡片，周围单据从不同方向加入。卡片保留前景位置，白色界面层以轻阴影与细边界区分。

## 上传动作必须落到对应单据

文件标签靠近光标，被送进上传区后转成发票详情；详情再接到账单列表。不要把上传与结果当作无关切镜。

```motion-demo
{
  "id": "clip-2",
  "title": "上传动作必须落到对应单据",
  "src": "demos/clip-2.html",
  "duration": 3.3,
  "status": "authored",
  "description": "3.7–7 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最后把局部业务收进工作台

报表占大区域，账单侧栏与卡片继续留在周边。图表用低饱和多色，荧光黄只点亮主要操作。换主题时同时更新金额、列表行、报表与凭证。

## 配色与字形

产品界面无衬线；小标签与金额采用稳定对齐。

#f6f5f3 · #171917 · #d8f646 · #a5c2f2 · #e9e9e7

## 元素与制作规则

实体卡 / 发票 / 上传区 / 账单列表 / 报表曲线 / 交易详情

- 暖白底上先放黑色卡片，周围单据从不同方向加入。卡片保留前景位置，白色界面层以轻阴影与细边界区分。
- 文件标签靠近光标，被送进上传区后转成发票详情；详情再接到账单列表。不要把上传与结果当作无关切镜。
- 报表占大区域，账单侧栏与卡片继续留在周边。图表用低饱和多色，荧光黄只点亮主要操作。换主题时同时更新金额、列表行、报表与凭证。

## 内容替换

- 可换费用、账单、订单等业务；保持同一记录在多视图的对应。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Ramp",
  "id": "V170",
  "palette": [
    "#f6f5f3",
    "#171917",
    "#d8f646",
    "#a5c2f2",
    "#e9e9e7"
  ],
  "typography": "产品界面无衬线；小标签与金额采用稳定对齐",
  "sample": "Ramp",
  "objects": [
    "实体卡",
    "发票",
    "上传区",
    "账单列表",
    "报表曲线",
    "交易详情"
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
      "timeSeconds": 1.4333333333333333,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 3.8333333333333335,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 8.266666666666667,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 10.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 11.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "卡片出场",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "单据围绕",
      "end": 3.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.7,
      "label": "拖入发票",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "账单关联",
      "end": 8.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.2,
      "label": "完整报表",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "账单详情",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "预测与交易",
      "end": 13.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 13.033333,
  "fontFamily": "Arial, sans-serif"
}
```
