# Directory 免费招聘数据

头像依次围绕中央标题出现，头像大小接近并带简短身份标签。标题保留两行，品牌所在行用橙色。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 19.95,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Firecrawl Directory",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f56b2c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Firecrawl Directory",
        "accent": "#f56b2c"
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

## 用人物环说明检索对象

头像依次围绕中央标题出现，头像大小接近并带简短身份标签。标题保留两行，品牌所在行用橙色。

```motion-demo
{
  "id": "clip-1",
  "title": "用人物环说明检索对象",
  "src": "demos/clip-1.html",
  "duration": 3.5999999999999996,
  "status": "authored",
  "description": "0.2–3.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 让查询自然展开为表格

头像退走后，只留一条搜索输入；提交后显示数据来源，再扩展为多行人才结果。表格滚动时固定列头，避免靠放大文字制造假变化。

## 从这一类数据退回完整目录

结果展示后拉出许多来源标签，再留下 Directory 与品牌。迁移时头像、查询条件和结果行必须属于同一人群。

| 时间 | 段落 |
|---|---|
| 0.00–3.50s | 头像环与标题 |
| 3.50–4.50s | 头像退场 |
| 4.50–7.00s | 人才检索输入 |
| 7.00–10.00s | 来源工作状态 |
| 10.00–13.00s | 结果表滚动 |
| 13.00–18.00s | 来源库 |
| 18.00–19.95s | 品牌 |

## 配色与字形

白色开放空间，小头像围合黑橙双行标题，结果为浅色表格。。

#ffffff · #222222 · #f56b2c · #e7e7e7 · #a9b6bf

## 元素与制作规则

环状头像 / 检索标题 / 搜索框 / 来源徽标 / 人才表格

- 头像依次围绕中央标题出现，头像大小接近并带简短身份标签。标题保留两行，品牌所在行用橙色。
- 头像退走后，只留一条搜索输入；提交后显示数据来源，再扩展为多行人才结果。表格滚动时固定列头，避免靠放大文字制造假变化。
- 结果展示后拉出许多来源标签，再留下 Directory 与品牌。迁移时头像、查询条件和结果行必须属于同一人群。

## 内容替换

- 替换为客户、专家或职位检索，保持人群与搜索结果一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Firecrawl",
  "id": "V122",
  "palette": [
    "#ffffff",
    "#222222",
    "#f56b2c",
    "#e7e7e7",
    "#a9b6bf"
  ],
  "typography": "白色开放空间，小头像围合黑橙双行标题，结果为浅色表格。",
  "sample": "Firecrawl Directory",
  "objects": [
    "环状头像",
    "检索标题",
    "搜索框",
    "来源徽标",
    "人才表格"
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
      "timeSeconds": 3.4166666666666665,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 4.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 10.0,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 13.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 18.0,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "头像环与标题",
      "end": 3.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.5,
      "label": "头像退场",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "人才检索输入",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "来源工作状态",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "结果表滚动",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "来源库",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "品牌",
      "end": 19.95,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 19.95,
  "fontFamily": "Arial, sans-serif"
}
```
