# Cursor Origin｜代码托管

把代码托管讲成一条完整生命周期：建立仓库、审查改动、通过检查、合并，再进入部署。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 30.9,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Code Hosting",
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
        "title": "Code Hosting",
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

## 两种入口汇入仓库列表

从新建仓库或同步现有仓库开始，填写名称并确认后才出现列表项。导航选中状态与页面内容保持一致，让观众知道已从创建进入管理。

浅色工作区搭配紫色外围，按钮和当前仓库用少量强调色。代码区用等宽字体，界面标题与标签使用清晰无衬线。

## 把审查落在一段具体代码

进入改动后，先给差异上下文，再选中几行并打开问答菜单。选中区域、提问入口与回复指向同一段内容，不用整页滚动代替审查动作。

```motion-demo
{
  "id": "clip-2",
  "title": "把审查落在一段具体代码",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "14–21 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 通过检查后再合并

检查状态出现后才强调合并按钮，点击后进入 CI 或部署段落。用短标题在创建、审查与发布之间换气，但每个标题后面都要接到操作。

| 节点 | 保留的前提 |
| --- | --- |
| 仓库出现 | 已创建或已同步 |
| 审查代码 | 已有具体改动 |
| 允许合并 | 检查状态清楚 |
| 部署 | 合并后的结果 |

## 更换目标平台时保持生命周期

替换仓库名、差异、问题和部署目的地。不要只换导航文字；创建来源、审查内容和发布结果要属于同一项目。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f5f5f1 · #202122 · #9966cc · #f1ba8a · #9ab8ad

## 元素与制作规则

导航 / 新建表单 / 仓库列表 / 代码差异 / 上下文菜单 / 检查状态 / 合并按钮 / 部署目标

- 仓库从新建或同步两种入口进入同一列表，再进入PR审查
- 先解释代码再合并；通过检查后按钮才成为最后行动
- CI、部署是合并之后的后续阶段，黑白标题做节奏分段

## 内容替换

- 可迁移为内容或代码生命周期，保留创建→检查→合并→发布顺序
- 替换仓库代码与目的地时保持审核状态一致

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cursor",
  "id": "V258",
  "palette": [
    "#f5f5f1",
    "#202122",
    "#9966cc",
    "#f1ba8a",
    "#9ab8ad"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Code Hosting",
  "objects": [
    "导航",
    "新建表单",
    "仓库列表",
    "代码差异",
    "上下文菜单",
    "检查状态",
    "合并按钮",
    "部署目标"
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
      "timeSeconds": 4.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 10.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 16.0,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 21.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 28.0,
      "frameId": "K0064",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "代码库入口",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "功能主张",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "新建仓库",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "输入名称",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "同步GitHub",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "仓库列表",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "审查合并",
      "end": 16.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16.0,
      "label": "代码问答",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "检查通过",
      "end": 21.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21.0,
      "label": "合并",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "CI与部署",
      "end": 28.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28.0,
      "label": "Origin品牌",
      "end": 30.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 30.9,
  "fontFamily": "Arial, sans-serif"
}
```
