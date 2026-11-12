# Framer 3.0｜品牌与产品发布

开场光线引出分支和发布操作，中段放具体编辑结果，后段再把界面语言抽象成玻璃符号。蓝色既是选中状态，也是全片材质线索。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 75.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 29,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "A whole new Framer",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#1386ff"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "A whole new Framer",
        "accent": "#1386ff"
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

## 用同一种蓝光连接功能与品牌

开场光线引出分支和发布操作，中段放具体编辑结果，后段再把界面语言抽象成玻璃符号。蓝色既是选中状态，也是全片材质线索。

## 每段只突出一个变化

编辑区按内容修改、协作、响应式、代码组件、CMS 的次序推进。镜头先给局部操作，再拉远看结果；多个页面同时出现时保持等宽对齐。

| 时间 | 段落 |
|---|---|
| 0.00–10.00s | 蓝光与分支 |
| 10.00–16.00s | 发布与编辑 |
| 16.00–27.00s | 页面协作 |
| 27.00–32.00s | 响应式画幅 |
| 32.00–42.00s | 代码与组件 |
| 42.00–53.00s | CMS 与界面矩阵 |
| 53.00–65.00s | 玻璃品牌宣言 |
| 65.00–75.00s | 标志收尾 |

## 组件段允许更密集的切换

照片轮盘、粒子球、图片拖尾、字词滚筒和网格画廊在黑色舞台里快速更换。外框与展示范围保持固定，让变化集中在内部。

```motion-demo
{
  "id": "clip-3",
  "title": "组件段允许更密集的切换",
  "src": "demos/clip-3.html",
  "duration": 5,
  "status": "authored",
  "description": "33–38 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用材质段承担最终情绪

发布宣言居中，蓝色玻璃折射在其后流过，最后压缩为明亮标志。替换主题时同时替换功能顺序和末段短句，继续使用同一强调色。

## 配色与字形

黑底蓝光贯穿产品界面与玻璃符号；文字用白色无衬线。。

#03050a · #ffffff · #1386ff · #17244f · #824cff

## 元素与制作规则

蓝色光线 / 产品工作区 / 协作光标 / 响应式页面 / 组件样例 / 界面矩阵 / 玻璃符号

- 开场光线引出分支和发布操作，中段放具体编辑结果，后段再把界面语言抽象成玻璃符号。蓝色既是选中状态，也是全片材质线索。
- 编辑区按内容修改、协作、响应式、代码组件、CMS 的次序推进。镜头先给局部操作，再拉远看结果；多个页面同时出现时保持等宽对齐。
- 照片轮盘、粒子球、图片拖尾、字词滚筒和网格画廊在黑色舞台里快速更换。外框与展示范围保持固定，让变化集中在内部。

## 内容替换

- 保持由功能细节走向产品全貌再到品牌宣言的结构。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Framer",
  "id": "V301",
  "palette": [
    "#03050a",
    "#ffffff",
    "#1386ff",
    "#17244f",
    "#824cff"
  ],
  "typography": "黑底蓝光贯穿产品界面与玻璃符号；文字用白色无衬线。",
  "sample": "A whole new Framer",
  "objects": [
    "蓝色光线",
    "产品工作区",
    "协作光标",
    "响应式页面",
    "组件样例",
    "界面矩阵",
    "玻璃符号"
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
      "timeSeconds": 10.0,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 27.0,
      "frameId": "K0113",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 32.0,
      "frameId": "K0134",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 53.0,
      "frameId": "K0210",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 65.0,
      "frameId": "K0264",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "蓝光与分支",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "发布与编辑",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "页面协作",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "响应式画幅",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "代码与组件",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "CMS 与界面矩阵",
      "end": 53,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 53,
      "label": "玻璃品牌宣言",
      "end": 65,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 65,
      "label": "标志收尾",
      "end": 75.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 75.0,
  "fontFamily": "Arial, sans-serif"
}
```
