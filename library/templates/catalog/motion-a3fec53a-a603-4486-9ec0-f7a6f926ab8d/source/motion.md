# K3.1｜无文案预热

用代码条带与相似形状连接机械、自然和三维物体。前段密集切换，后段收成一个球体与品牌名。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 24.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Kimi",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d86f4b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Kimi",
        "accent": "#d86f4b"
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

## 围绕圆环、旋涡和球体挑素材

复古电脑、机械构件、阶梯、月球和自然细节交替出现。浅灰纸面与深黑影像形成明暗切换，代码采用等宽小字，主体保持足够大。

## 故障切片连接两个画面

把上一镜分成错位条带，局部透出下一镜，再让后者接管全幅。切片方向跟随主体形状或代码行方向，保留中心物体的轮廓落点。

```motion-demo
{
  "id": "clip-2",
  "title": "故障切片连接两个画面",
  "src": "demos/clip-2.html",
  "duration": 9,
  "status": "authored",
  "description": "0–9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 素材快切，形状慢慢接续

相邻镜头共享一个视觉关系：圆心、弧线、环绕或螺旋。每次只突出一个关系，用不同材质形成变化，让代码叠层短暂经过而不遮满主体。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 旧电脑代码 |
| 2.00–4.00s | 机械结构 |
| 4.00–6.00s | 自然与代码干扰 |
| 6.00–9.00s | 月球与流体 |
| 9.00–12.00s | 冰川和材料 |
| 12.00–16.00s | 身体与生态 |
| 16.00–19.00s | 自然细节 |
| 19.00–22.00s | 地球收束 |
| 22.00–24.03s | 品牌 |

## 结尾降低密度

把丰富形态汇入单个地球或球形物体，减弱切片和代码，最后切黑留下品牌。产品字标用简洁无衬线，长度远短于前面的视觉信息。

## 用新的素材建立联想

可以替换科技、自然或行业画面，但先按共享形状配对再安排剪辑。保留复古入口、计算叠层与单体收束，避免只按颜色随机拼接。

## 配色与字形

复古电脑、科学与自然拼贴、条带故障、三维物体。

#e3e3df · #121515 · #d86f4b · #4b7e9e · #789d8e

## 元素与制作规则

复古电脑 / 代码条带 / 机械对象 / 自然镜头 / 球体 / 手部轮廓 / 品牌

- 多个主题以代码条带和错位切片连接，表达物理世界与计算的关联。
- 圆环、旋涡、球体构成跨镜头形状呼应。
- 最后收敛到单个地球再落版，密度从高到低。

## 内容替换

- 换主题需提供同类图像组，保留共通形状和故障切片语法。
- 只保留代码叠层不等于恢复真实世界素材。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Kimi",
  "id": "V032",
  "palette": [
    "#e3e3df",
    "#121515",
    "#d86f4b",
    "#4b7e9e",
    "#789d8e"
  ],
  "typography": "复古电脑、科学与自然拼贴、条带故障、三维物体",
  "sample": "Kimi",
  "objects": [
    "复古电脑",
    "代码条带",
    "机械对象",
    "自然镜头",
    "球体",
    "手部轮廓",
    "品牌"
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
      "path": "https://r.open-design.ai/files/787f79e326e9bee13de257b3af3af517ce6804bd8d034a8362d2714eabec3e0b",
      "timeSeconds": 4.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 12.0,
      "frameId": "K0069",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/50340fe7b7fb015fe2edb5e12f4e0f2bb21b8842b23d2b9f355e05946f6f2d67",
      "timeSeconds": 16.0,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0126",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "旧电脑代码",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "机械结构",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "自然与代码干扰",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "月球与流体",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "冰川和材料",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "身体与生态",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "自然细节",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "地球收束",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "品牌",
      "end": 24.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 24.033333,
  "fontFamily": "Arial, sans-serif"
}
```
