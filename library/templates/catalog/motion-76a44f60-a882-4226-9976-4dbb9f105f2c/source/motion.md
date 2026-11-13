# Cursor Figma Component Creation — Cursor can now…

从已有设计系统出发生成页面，再进入设计工具检查图层与组件。最终画面不仅要好看，还要让结构可见。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 25.416667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build with a design system",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9966cc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build with a design system",
        "accent": "#9966cc"
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

## 先说明采用哪套设计系统

输入里同时交代目标页面与设计系统。执行过程按查找组件、读取变量、构建画板、检查结构推进，工具列表保持整齐，不需要逐条展开冗长日志。

对话区用浅色、常规无衬线与清楚的状态标记；强调色只标正在处理的步骤。

## 结果链接把观众带进可编辑画板

生成完成后，先出现明确结果链接，再打开设计工具。完整画板先停留，随后推近侧栏或某个组件；图层树与画布中的选中边框同步变化。

```motion-demo
{
  "id": "clip-2",
  "title": "结果链接把观众带进可编辑画板",
  "src": "demos/clip-2.html",
  "duration": 9,
  "status": "authored",
  "description": "16–25 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用局部结构证明编辑关系

选择一个能体现组件复用的区域，例如侧栏、统计卡或导航项。选中状态只框住相应对象，属性面板跟随对象更新；不要只放一张最终截图。

画板内部遵循所选设计系统的字形、间距和配色。工具外壳与作品样式分开处理，避免主题色覆盖所有工具文字。

## 换系统时重建组件来源

新主题需要对应的变量、组件和页面内容。保留读取规范到生成，再到局部编辑检查的顺序，结果层级与实际页面内容保持一致。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

提示框 / 工具调用列表 / 设计系统变量 / 结果链接 / 画板 / 图层树 / 组件选框

- 先查已有设计系统与变量，后创建画板而不是自由画一个相似图
- 成果链接带到外部设计工具，选择组件与图层证明可编辑性
- 镜头逐步放大至局部结构，保持画板和图层选择同步

## 内容替换

- 可迁移为结构化设计生成，保留查规范→生成→检查可编辑结构
- 只给最终截图不足以表达可编辑性，需要层级对象

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V239",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Build with a design system",
  "objects": [
    "提示框",
    "工具调用列表",
    "设计系统变量",
    "结果链接",
    "画板",
    "图层树",
    "组件选框"
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
      "path": "https://r.open-design.ai/files/61a0ae6b5ff140ad6e99f54881def1a66fb4978d7cc451dc07e7551ed4dfaacf",
      "timeSeconds": 7.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c638392c76ae2e9da9c00e1dd72fabd44d16b190a9f4548d22cd9203cd194618",
      "timeSeconds": 13.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d4f9df7283caa4d0c6a1ddce5c202dd56422e2e954741f5116139a953dbc5f72",
      "timeSeconds": 16.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0044",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9a15f95a04371434f84cfba621c53c63278c9e2f81abaa55f7b6a842ffc2c17d",
      "timeSeconds": 24.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "输入Figma需求",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "搜索设计系统",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "读取组件变量",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "构建画板",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "检查元数据",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "输出链接",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "打开Figma",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "选中侧栏",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "检查图层",
      "end": 24.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24.0,
      "label": "局部组件",
      "end": 25.416667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 25.416667,
  "fontFamily": "Arial, sans-serif"
}
```
