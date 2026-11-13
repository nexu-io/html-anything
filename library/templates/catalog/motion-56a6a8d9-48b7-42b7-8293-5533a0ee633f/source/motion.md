# Dub launches Partner Referrals

从发布物件进入一个伙伴的收益，再扩大到整个招募漏斗和明细分析，用个人结果承接产品数据。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.06684,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 15.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Partner referrals",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#3469f1"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Partner referrals",
        "accent": "#3469f1"
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

## 复古开场只负责发布身份

两张软盘在暗网格舞台出现，第二张标注新功能。噪声切换后进入浅色产品段，软盘与老电视质感退出，让界面保持清洁。

## 从一群伙伴聚焦到一个结果

头像围绕中心展开，品牌接管中心后再留下一个伙伴；收益数字与销售事件向下延伸。头像、姓名和事件归属保持一致，之后才扩大到整体转化。

## 漏斗分段与上方统计同步

Visits、Starts、Submissions、Approvals 沿水平轴依次填色，流带宽度逐段变窄。上方数字与下方伙伴行共享阶段列宽，最后拉远显示整个后台。

```motion-demo
{
  "id": "clip-3",
  "title": "漏斗分段与上方统计同步",
  "src": "demos/clip-3.html",
  "duration": 5.100000000000001,
  "status": "authored",
  "description": "14.2–19.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用浅底承接彩色分析，不把颜色铺满

蓝、紫、粉、薄荷只用于漏斗阶段与对应标记，白色界面用淡网格与弱边线。主张黑字居中独立一屏，末尾品牌和短链接清楚停留。

## 换业务时保留个体到整体的展开

替换伙伴头像、事件、金额、漏斗阶段和表格数据，同时更新落版功能名。适合渠道、招聘或申请流程，但各阶段要有真实的递进关系。

## 配色与字形

无衬线界面和主张；软盘标签有复古标题感，统计数字层级明显。

#f8f9fa · #151819 · #3469f1 · #9c40ee · #e964bb · #21d4b6

## 元素与制作规则

软盘发布卡 / 头像网络 / 中心伙伴 / 收入事件 / 转化漏斗 / 明细表 / 功能落版

- 从发布物件进入一个伙伴的收益，再扩大到整个招募漏斗和明细分析，用个人结果承接产品数据。
- 两张软盘在暗网格舞台出现，第二张标注新功能。噪声切换后进入浅色产品段，软盘与老电视质感退出，让界面保持清洁。
- 头像围绕中心展开，品牌接管中心后再留下一个伙伴；收益数字与销售事件向下延伸。头像、姓名和事件归属保持一致，之后才扩大到整体转化。

## 内容替换

- 替换伙伴头像、事件、金额、漏斗阶段和表格数据，同时更新落版功能名。适合渠道、招聘或申请流程，但各阶段要有真实的递进关系。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Dub",
  "id": "V393",
  "palette": [
    "#f8f9fa",
    "#151819",
    "#3469f1",
    "#9c40ee",
    "#e964bb",
    "#21d4b6"
  ],
  "typography": "无衬线界面和主张；软盘标签有复古标题感，统计数字层级明显",
  "sample": "Partner referrals",
  "objects": [
    "软盘发布卡",
    "头像网络",
    "中心伙伴",
    "收入事件",
    "转化漏斗",
    "明细表",
    "功能落版"
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
      "timeSeconds": 5.266704659125885,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.400067809325947,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 14.2667695829486,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 18.533467028316405,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 23.40016880193906,
      "frameId": "K0065",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黑场",
      "end": 0.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.9,
      "label": "Launch Week 软盘",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "第二张软盘",
      "end": 5.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.3,
      "label": "噪声切换",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "伙伴头像",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "品牌接管",
      "end": 9.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.4,
      "label": "中心伙伴",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "收入与事件",
      "end": 14.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.3,
      "label": "转化面板",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "漏斗展开",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "明细表",
      "end": 18.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.5,
      "label": "全界面",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "功能主张",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "品牌与链接",
      "end": 23.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.4,
      "label": "噪声退出",
      "end": 24.06684,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.06684,
  "fontFamily": "Arial, sans-serif"
}
```
