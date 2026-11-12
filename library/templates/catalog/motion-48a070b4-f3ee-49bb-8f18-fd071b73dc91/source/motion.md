# Manus 做的网站能装成桌面 app

让同一个网站从浏览器进入桌面环境。内容保持不变，通过窗口容器、程序坞和快捷切换说明应用化之后的使用方式。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 19.283333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Any website. One click.",
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
        "title": "Any website. One click.",
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

## 安装动作改变的是容器

先展示网站，再推近安装入口与确认框。安装后网页内容从浏览器框中脱离，变成独立应用窗口；不要同时更换网页内容，否则观众容易理解成另一个产品。

## 用系统位置建立“已安装”的感觉

独立窗口出现后，在程序坞补上对应图标。系统搜索、快捷键切换和并排工作依次展示，让同一个图标与窗口在各场景中保持一致。

浅色背景、细边框与轻阴影突出窗口层次。界面文字用清晰无衬线字体，快捷键符号保持紧凑，强调色只用于安装与当前选择。

## 一组连续的桌面动作

搜索启动时先出现搜索词，再打开窗口；快捷键切换时先出现选择状态，再转到目标窗口。并排阶段保持窗口边界清楚，让空间关系自己说明工作方式。

```motion-demo
{
  "id": "clip-3",
  "title": "一组连续的桌面动作",
  "src": "demos/clip-3.html",
  "duration": 7.5,
  "status": "authored",
  "description": "7.5–15 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换为你的网站

准备同一网站的浏览器态和独立应用态，再补齐图标、应用名与搜索词。可以替换网站类型，保留安装、启动、切换、并排四个动作。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

浏览器窗口 / 安装弹框 / 独立窗口 / 程序坞图标 / 快捷键提示

- 同一网站从浏览器框中脱离成为独立窗口，内容身份保持
- 安装后程序坞增加对应图标，再演示启动与切换
- 最后窗口并排和堆叠说明系统级使用，动作不是无目的漂浮

## 内容替换

- 可迁移为网页到不同终端的转换，保留内容不变而容器改变
- 系统入口和快捷键需随目标平台替换

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V045",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Any website. One click.",
  "objects": [
    "浏览器窗口",
    "安装弹框",
    "独立窗口",
    "程序坞图标",
    "快捷键提示"
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
      "timeSeconds": 3.5,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.6,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 9.4,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 17.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "网页变应用主张",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "多站点",
      "end": 3.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.5,
      "label": "安装按钮",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "独立应用",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "系统搜索启动",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "快捷键切换",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "并排窗口",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "应用队列",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "品牌",
      "end": 19.283333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 19.283333,
  "fontFamily": "Arial, sans-serif"
}
```
