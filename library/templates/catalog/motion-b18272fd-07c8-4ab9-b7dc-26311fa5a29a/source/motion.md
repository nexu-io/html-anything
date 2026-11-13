# Higgsfield — plugin now in the ChatGPT app

从插件的入口走到可批量使用的成果，再用表现数据决定下一步。让生成与筛选构成一个连续工作流。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 35.3,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Create with Higgsfield",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c3f629"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Create with Higgsfield",
        "accent": "#c3f629"
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

## 先交代插件能在哪里使用

用平台标记、插件入口和模型或技能清单建立环境。名称使用清晰无衬线字体，选中项用强调底色而不是低对比彩字；其他选项降低权重。

白底、黑字与荧光绿形成主要层级，粉色和浅蓝只用于不同媒体或结果分类。

## 一条批量请求，对应一组完整成果

输入中交代产品来源、创意方向和输出数量。随后展示任务进行状态，再展开图像或视频网格；网格中的内容要有变化，同时仍属于同一批任务。

## 从作品墙切到表现排行

先让观众看到成品，再显示评价指标与排序。排行榜突出一项时，保留对应的作品身份或缩略图，不能只展示一组脱离作品的柱子。

最后的自动化动作应来自筛选结果，例如继续迭代高表现方向或安排下一轮生产。

```motion-demo
{
  "id": "clip-3",
  "title": "从作品墙切到表现排行",
  "src": "demos/clip-3.html",
  "duration": 14,
  "status": "authored",
  "description": "20–34 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换任务，也替换评价标准

可改为产品图、活动视频或设计方案。提示词、素材目录、输出集合、评价指标和后续动作同步改写；不同任务不必都用同一个商业指标。

## 配色与字形

无衬线界面文字与清晰大小层级。

#ffffff · #171717 · #c3f629 · #f086c2 · #ade0db

## 元素与制作规则

插件选择 / 模型列表 / 任务输入 / 批量结果 / 图表 / 排名卡

- 先选插件与技能，再输入跨工具任务，执行步骤顺序出现
- 结果从素材网格转换为性能指标和排名，表达生成后的运营闭环
- 最后将一次任务设为重复流程

## 内容替换

- 可迁移为设计插件的生成→发布→分析流程
- 更换数据和作品时保持排名与指标一致

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Higgsfield",
  "id": "V305",
  "palette": [
    "#ffffff",
    "#171717",
    "#c3f629",
    "#f086c2",
    "#ade0db"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Create with Higgsfield",
  "objects": [
    "插件选择",
    "模型列表",
    "任务输入",
    "批量结果",
    "图表",
    "排名卡"
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
      "timeSeconds": 5.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.0,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 20.0,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 26.0,
      "frameId": "K0086",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 32.0,
      "frameId": "K0111",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "平台标记",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "产品接入",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "模型列表",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "选择插件",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "输入任务与技能",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "执行过程",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "批量成果",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "查询表现",
      "end": 26.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26.0,
      "label": "数据图表",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "排名素材",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "定期执行",
      "end": 35.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 35.3,
  "fontFamily": "Arial, sans-serif"
}
```
