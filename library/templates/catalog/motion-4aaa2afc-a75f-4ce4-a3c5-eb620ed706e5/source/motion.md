# Miro｜产品发布合集

用同一个产品项目贯穿目标、研究、设计与开发。每次换视图都保留项目名称或关键问题，让长片读成一个持续推进的工作流程。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 144.133333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 57,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Miro Product Acceleration",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ffd62e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Miro Product Acceleration",
        "accent": "#ffd62e"
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

## 先把团队面对的问题放在一起

黄色开场后切到浅色画布，业务目标卡与带名字的游标逐步加入。大问题句居中，便签在周边响应；不要同时铺满目标、研究和原型。

## 目标先变成可安排的工作

目标表、里程碑时间线与看板依次接力。表格行与甘特条保持同色项目标记，右侧助理面板只辅助解释当前一步。

```motion-demo
{
  "id": "clip-2",
  "title": "目标先变成可安排的工作",
  "src": "demos/clip-2.html",
  "duration": 6,
  "status": "authored",
  "description": "53–59 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 让用户洞察真正进入原型

把反馈整理成洞察卡，再从卡片打开生成菜单，转到手机原型。输入问题、选择操作、生成结果要顺序出现，避免用无关手机页面替代结果。

```motion-demo
{
  "id": "clip-3",
  "title": "让用户洞察真正进入原型",
  "src": "demos/clip-3.html",
  "duration": 8,
  "status": "authored",
  "description": "93–101 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最后把设计交给开发

产品说明、实体关系图、手机界面和代码工作区依次出现。每次保留前一步的小缩略或同名标题，用整体时间线说明从策略到交付的完整链路。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 黄色品牌开场 |
| 7.00–19.00s | 目标与协作 |
| 19.00–31.00s | 产品加速主张 |
| 31.00–43.00s | 业务目标 |
| 43.00–54.00s | 策略与洞察 |
| 54.00–72.00s | 时间线与看板 |
| 72.00–84.00s | 设计与架构 |
| 84.00–94.00s | 收集反馈 |
| 94.00–110.00s | 生成原型 |
| 110.00–121.00s | 技术方案 |
| 121.00–133.00s | 交付开发 |
| 133.00–144.13s | 品牌收束 |

## 换项目要连同上下游一起换

准备同一主题的业务目标、三条洞察、一个原型和开发说明。便签颜色只表示分组；手机与文档保持白底深字，紫、蓝、粉作为辅助，不增加新的主色。

## 配色与字形

大标题用粗无衬线；表格、便签与手机正文控制在两级字号。

#fbfaf7 · #22211f · #ffd62e · #dac6f7 · #b7dfea · #efc4ce

## 元素与制作规则

便签 / 协作者游标 / 目标表 / 时间线 / 洞察卡 / 手机原型 / 文档 / 架构图

- 黄色开场后切到浅色画布，业务目标卡与带名字的游标逐步加入。大问题句居中，便签在周边响应；不要同时铺满目标、研究和原型。
- 目标表、里程碑时间线与看板依次接力。表格行与甘特条保持同色项目标记，右侧助理面板只辅助解释当前一步。
- 把反馈整理成洞察卡，再从卡片打开生成菜单，转到手机原型。输入问题、选择操作、生成结果要顺序出现，避免用无关手机页面替代结果。
- 产品说明、实体关系图、手机界面和代码工作区依次出现。每次保留前一步的小缩略或同名标题，用整体时间线说明从策略到交付的完整链路。
- 准备同一主题的业务目标、三条洞察、一个原型和开发说明。便签颜色只表示分组；手机与文档保持白底深字，紫、蓝、粉作为辅助，不增加新的主色。

## 内容替换

- 替换完整项目与协作者；保留目标→研究→原型→架构→交付的因果链。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Miro",
  "id": "V351",
  "palette": [
    "#fbfaf7",
    "#22211f",
    "#ffd62e",
    "#dac6f7",
    "#b7dfea",
    "#efc4ce"
  ],
  "typography": "大标题用粗无衬线；表格、便签与手机正文控制在两级字号",
  "sample": "Miro Product Acceleration",
  "objects": [
    "便签",
    "协作者游标",
    "目标表",
    "时间线",
    "洞察卡",
    "手机原型",
    "文档",
    "架构图"
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
      "timeSeconds": 19.0,
      "frameId": "K0065",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/6019c302add7ff9d17ca958263c4672dd1d7e1f12214763acac4084ee5c5c137",
      "timeSeconds": 43.0,
      "frameId": "K0130",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 84.0,
      "frameId": "K0282",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 110.0,
      "frameId": "K0386",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 133.0,
      "frameId": "K0471",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黄色品牌开场",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "目标与协作",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "产品加速主张",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "业务目标",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "策略与洞察",
      "end": 54,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 54,
      "label": "时间线与看板",
      "end": 72,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 72,
      "label": "设计与架构",
      "end": 84,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 84,
      "label": "收集反馈",
      "end": 94,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 94,
      "label": "生成原型",
      "end": 110,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 110,
      "label": "技术方案",
      "end": 121,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 121,
      "label": "交付开发",
      "end": 133,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 133,
      "label": "品牌收束",
      "end": 144.133333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 144.133333,
  "fontFamily": "Arial, sans-serif"
}
```
