# Grok Bot can now search, read, and monitor X.

先让来源进入画面，再把多个声音压缩成摘要。一个短案例结束后，用一句能力说明收尾。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 12.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.1,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Search X",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4094e9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Search X",
        "accent": "#4094e9"
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

## 帖子形成一组可见的来源

蓝色请求气泡放在上方，白色帖子从下方汇入，彼此错开、略微倾斜。正文用紧凑无衬线，优先保留来源名和关键一句。

## 从来源集合收成摘要

帖子聚拢后退场，摘要接到同一中心位置。分点结论逐项出现，最后把少数能力词高亮，再留下角色和品牌。

## 换资料，也换结论

可以改为访谈、评论或文档检索。新版本同时准备来源卡和主题摘要；来源数量增加时缩减每张卡内容，保持“很多来源、少数结论”的密度变化。

## 配色与字形

白底蓝提问、叠放帖子、黑色圆形角色。

#ffffff · #161616 · #4094e9 · #8dc68d · #e8eeee

## 元素与制作规则

提问气泡 / 原始帖子 / 汇总段落 / 强调词 / 角色

- 先展示被检索的多个来源，再压缩为主题汇总。
- 原始卡片聚集退场后才出现结论，说明结论来自来源。
- 末段用少量高亮词把具体案例归纳为能力。

## 内容替换

- 换成用户访谈或文档检索时保留多来源→归纳→能力。
- 来源数量与结论在迁移时另设，不能沿用样片事实。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V023",
  "palette": [
    "#ffffff",
    "#161616",
    "#4094e9",
    "#8dc68d",
    "#e8eeee"
  ],
  "typography": "白底蓝提问、叠放帖子、黑色圆形角色",
  "sample": "Search X",
  "objects": [
    "提问气泡",
    "原始帖子",
    "汇总段落",
    "强调词",
    "角色"
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
      "timeSeconds": 1.5,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.8,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 9.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "输入反馈问题",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "帖子汇入",
      "end": 3.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.8,
      "label": "汇总回答",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "检索与分析短句",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "品牌",
      "end": 12.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 12.166667,
  "fontFamily": "Arial, sans-serif"
}
```
