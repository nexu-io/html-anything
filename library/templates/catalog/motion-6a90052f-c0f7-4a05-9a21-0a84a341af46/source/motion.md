# Emergent｜移动应用发布

前几秒只交代应用如何产生，后面把时间留给实际使用。通过一次连贯的手机操作，说明生成的并非一张静态页面。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 27.166667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Build a budget tracker",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Build a budget tracker",
        "accent": "#538cbe"
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

## 生成流程压缩，应用体验展开

访问入口、输入预算应用需求、出现构建过程后，迅速进入手机预览。电脑工作区退场后，手机边框和导航位置保持稳定。

## 每个页面展示一种能力

余额页讲概览，流水页讲筛选，统计页讲趋势，设置页讲调整，新增页讲输入。页间切换使用同一导航逻辑，不要用随机方向的飞入替代应用操作。

浅底、白色卡片与单一强调色保持金融工具的秩序。余额数字比明细醒目，图表说明比标题小；字体使用清晰无衬线，金额采用对齐数字。

| 页面 | 操作重点 |
| --- | --- |
| 概览 | 总额与分类关系 |
| 流水 | 选择分类或时间 |
| 统计 | 让图表对应数据 |
| 新增 | 输入金额并确认 |
| 返回概览 | 体现新增后的状态 |

## 让一次新增形成结尾

输入金额、选择分类、提交后回到概览。即使只改变少量数据，也要让列表、汇总和图表保持一致。

换成健身、库存或项目工具时，重选一组真正可操作的页面，保留从概览进入细节再返回的路径。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

网页入口 / 提示框 / 代码栏 / 手机容器 / 余额卡 / 分类图表 / 数字键盘

- 短建造段后用较长手机操作展示成果可用性
- 余额、流水、统计、设置共用同一手机边框，导航只替换内部内容
- 新增记录依赖金额输入，末尾回概览形成状态闭环

## 内容替换

- 迁移为任意可操作工具，保留输入→生成→实际使用的比例
- 替换数据时同步更新列表、图表和汇总，不仅换标题

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Emergent",
  "id": "V057",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Build a budget tracker",
  "objects": [
    "网页入口",
    "提示框",
    "代码栏",
    "手机容器",
    "余额卡",
    "分类图表",
    "数字键盘"
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
      "timeSeconds": 4.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 13.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 20.0,
      "frameId": "K0081",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 26.0,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "访问网站",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "登录",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "输入预算应用需求",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "生成代码",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "打开手机预览",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "余额概览",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "流水筛选",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "图表洞察",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "设置",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "新增记录",
      "end": 26.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26.0,
      "label": "回到概览",
      "end": 27.166667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 27.166667,
  "fontFamily": "Arial, sans-serif"
}
```
