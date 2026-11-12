# Grok — one prompt to a published app

让一句要求经过可操作的预览和局部修改，最后成为能发布的应用。手机与桌面分别承担不同使用场景。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 55.2,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build and publish",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ef875e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build and publish",
        "accent": "#ef875e"
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

## 白底把注意力留给应用本身

在大面积白色留白中放手机或桌面窗口，品牌说明使用短黑字。界面正文用无衬线，代码或状态文字降低字号与对比，预览结果保持最大面积。

## 第一个例子先证明能玩

从模式选择进入手机上的赛车应用，打开预览后给出一段连续操作。车型选择出现时，把选中的车同步带回同一个游戏画面。

```motion-demo
{
  "id": "clip-2",
  "title": "第一个例子先证明能玩",
  "src": "demos/clip-2.html",
  "duration": 19,
  "status": "authored",
  "description": "0–19 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 桌面例子说明能继续修改

切换到履历或项目管理应用时，沿用请求、预览、修改的关系。让输入区与结果区并排，修改发生后保留前后对应的位置。

## 发布是任务的终点

应用内容完整后再出现 Publish。点击后给清楚的落点，最后用跨设备短句概括覆盖范围，不在生成中间提前结束。

```motion-demo
{
  "id": "clip-4",
  "title": "发布是任务的终点",
  "src": "demos/clip-4.html",
  "duration": 18,
  "status": "authored",
  "description": "32–50 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 多个例子如何共用一条线

先用手机交互建立直观体验，再用桌面任务扩大用途。每个例子都比前一个多交代一项能力，结尾汇到发布。

| 时间 | 段落 |
|---|---|
| 0.00–8.00s | 选择构建模式 |
| 8.00–12.00s | 手机生成赛车 |
| 12.00–19.00s | 试用与改车型 |
| 19.00–23.00s | 构建发布主张 |
| 23.00–32.00s | 网页履历工具 |
| 32.00–42.00s | 项目管理应用 |
| 42.00–46.00s | 点击发布 |
| 46.00–50.00s | 跨设备主张 |
| 50.00–55.20s | 品牌 |

## 替换应用与品牌

新版本可改成画板、课程工具或团队工作台。准备一个能展示交互的例子和一个能展示修改的例子，最后给它们相同的交付动作。

## 配色与字形

白底超大留白、手机与桌面产品录屏、黑色短句。

#fafafa · #16191b · #ef875e · #51575b · #d9dce0

## 元素与制作规则

模式菜单 / 手机 / 赛车预览 / 车型选择 / 桌面应用 / 发布钮

- 先展示生成后能实际操作，再切到桌面展示另一类可发布应用。
- 车型切换必须反映到同一赛车对象，预览与编辑有连续性。
- 最后点击发布作为交付终点，不能只留下生成中的界面。

## 内容替换

- 可替换成设计工具：输入→交互预览→局部修改→发布。
- 产物必须可识别，不能用泛化卡片替代全部实例。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V328",
  "palette": [
    "#fafafa",
    "#16191b",
    "#ef875e",
    "#51575b",
    "#d9dce0"
  ],
  "typography": "白底超大留白、手机与桌面产品录屏、黑色短句",
  "sample": "Build and publish",
  "objects": [
    "模式菜单",
    "手机",
    "赛车预览",
    "车型选择",
    "桌面应用",
    "发布钮"
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
      "timeSeconds": 12.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 19.0,
      "frameId": "K0054",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 32.0,
      "frameId": "K0080",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 42.0,
      "frameId": "K0097",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 50.0,
      "frameId": "K0105",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "选择构建模式",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "手机生成赛车",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "试用与改车型",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "构建发布主张",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "网页履历工具",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "项目管理应用",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "点击发布",
      "end": 46,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 46,
      "label": "跨设备主张",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "品牌",
      "end": 55.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 55.2,
  "fontFamily": "Arial, sans-serif"
}
```
