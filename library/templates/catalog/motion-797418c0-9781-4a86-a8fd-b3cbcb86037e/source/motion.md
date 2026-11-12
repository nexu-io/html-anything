# Polymarket · 中期选举总览

把零散地区信息收成一张可浏览的地图，再从总览进入局部变化。观众先有空间概念，才读概率与新闻。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 36.916667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Midterms Hub",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#3d69eb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Midterms Hub",
        "accent": "#3d69eb"
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

## 从分散地区聚成地图

开场让地区形状与意见文字分散出现，随后收束成完整地图。聚合时保持每个地区的身份，结束后留下稳定的地理排列，避免只做随机方块汇聚。

白底、深色文字与红蓝两组颜色构成数据界面。地区名和概率用清晰无衬线字，概率数字保持对齐；颜色语义在所有镜头中一致。

## 总览给结构，局部给理由

席位条或汇总数字先建立全局，然后推近一个州。地区详情、选举类型和最新变化按层次展开，返回总览时仍能找到刚才的地区。

```motion-demo
{
  "id": "clip-2",
  "title": "总览给结构，局部给理由",
  "src": "demos/clip-2.html",
  "duration": 13,
  "status": "authored",
  "description": "12–25 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 新闻必须对应一个变化

一条新闻或状态更新进入时，让相关地区、概率或分布条同步突出。不要让新闻滚动与地图变色各自随机播放。

用相同图例连接地图、席位条和概率分布，时间标签说明变化发生的先后。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 噪声与意见 |
| 5.00–9.00s | 单州概率 |
| 9.00–12.00s | 地图聚合 |
| 12.00–15.00s | 席位总览 |
| 15.00–18.00s | 州详情 |
| 18.00–22.00s | 不同选举类型 |
| 22.00–25.00s | 新闻变化 |
| 25.00–28.00s | 概率分布 |
| 28.00–31.00s | 完整地图 |
| 31.00–35.00s | 导航入口 |
| 35.00–36.92s | 品牌 |

## 换成地域业务看板

先准备新地区边界、统一指标和稳定色彩分类，再安排局部故事。地图、汇总、详情与新闻引用同一组数据，保留从全局到局部再回全局的导航。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f9faf8 · #17202b · #3d69eb · #dd5664 · #d8dfe5

## 元素与制作规则

州形状 / 概率百分比 / 地图 / 席位条 / 选举分类 / 新闻流 / 时间标签

- 零散州形先分散再拼成地图，表示从噪声到结构化信息
- 总览推近局部州，再回到席位和概率分布，尺度变化保持地理关联
- 新闻变化与对应概率更新相邻出现

## 内容替换

- 可迁移为地域数据看板，保留地区→汇总→局部→变化解释
- 色彩必须有稳定图例；主题迁移需替换地理与实际数据

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Polymarket",
  "id": "V069",
  "palette": [
    "#f9faf8",
    "#17202b",
    "#3d69eb",
    "#dd5664",
    "#d8dfe5"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Midterms Hub",
  "objects": [
    "州形状",
    "概率百分比",
    "地图",
    "席位条",
    "选举分类",
    "新闻流",
    "时间标签"
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
      "timeSeconds": 9.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 15.0,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0077",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 28.0,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0114",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "噪声与意见",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "单州概率",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "地图聚合",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "席位总览",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "州详情",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "不同选举类型",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "新闻变化",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "概率分布",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "完整地图",
      "end": 31.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31.0,
      "label": "导航入口",
      "end": 35.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35.0,
      "label": "品牌",
      "end": 36.916667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 36.916667,
  "fontFamily": "Arial, sans-serif"
}
```
