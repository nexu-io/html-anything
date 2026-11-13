# watsonx｜平台发布

同一细丝材质在近景与整体之间切换，产品后缀和能力词跟随不同形态分组展开。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 33.9,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 18.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "watsonx",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ad99d2"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "watsonx",
        "accent": "#ad99d2"
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

## 先看材质，再看到整体轮廓

细丝近景逐渐露出球形结构，转到下一分支时重新进入局部，再回到新整体。保持细丝方向连续，近景变化成为产品分段的转场。

```motion-demo
{
  "id": "clip-1",
  "title": "先看材质，再看到整体轮廓",
  "src": "demos/clip-1.html",
  "duration": 5,
  "status": "authored",
  "description": "3–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 文字让出主视觉，但固定阅读锚点

产品名靠左，ai、data、governance 依次替换后缀，下方能力词逐行增加。浅灰背景、淡紫丝线与黑色无衬线形成轻重差；不要把名称放进最密的纹理里。

## 分支变化最终回到同一母体

每组能力词对应一种细丝组织方式，末段回归母品牌和完整形态，再以 IBM 标志结束。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 浅底 |
| 3.00–6.50s | 细丝近景 |
| 6.50–9.00s | 球形整体 |
| 9.00–12.00s | ai 分支 |
| 12.00–15.00s | 生成与学习词 |
| 15.00–16.00s | 纹理切换 |
| 16.00–18.00s | data 分支 |
| 18.00–21.00s | 能力词 |
| 21.00–25.00s | governance 分支 |
| 25.00–28.00s | 治理词 |
| 28.00–32.00s | 母品牌 |
| 32.00–33.90s | IBM |

## 迁移为一个产品家族

替换母名、后缀与能力词，选择能共享同种材质的三种结构。形态可以不同，材质与光照要一致，文字位置保持连续。

## 配色与字形

无衬线小号产品名；后缀与能力词逐行增加，左侧对齐。

#e7e3e2 · #161318 · #ad99d2 · #d6cbe8 · #7374c9

## 元素与制作规则

细丝曲面 / 球形构造 / 产品后缀 / 能力词列 / 品牌字标

- 同一细丝材质在近景与整体之间切换，产品后缀和能力词跟随不同形态分组展开。
- 细丝近景逐渐露出球形结构，转到下一分支时重新进入局部，再回到新整体。保持细丝方向连续，近景变化成为产品分段的转场。
- 产品名靠左，ai、data、governance 依次替换后缀，下方能力词逐行增加。浅灰背景、淡紫丝线与黑色无衬线形成轻重差；不要把名称放进最密的纹理里。

## 内容替换

- 替换母名、后缀与能力词，选择能共享同种材质的三种结构。形态可以不同，材质与光照要一致，文字位置保持连续。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "IBM",
  "id": "V369",
  "palette": [
    "#e7e3e2",
    "#161318",
    "#ad99d2",
    "#d6cbe8",
    "#7374c9"
  ],
  "typography": "无衬线小号产品名；后缀与能力词逐行增加，左侧对齐",
  "sample": "watsonx",
  "objects": [
    "细丝曲面",
    "球形构造",
    "产品后缀",
    "能力词列",
    "品牌字标"
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
      "timeSeconds": 6.514117647058824,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 11.964705882352941,
      "frameId": "K0045",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 17.947058823529414,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 24.926470588235293,
      "frameId": "K0100",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 32.00558823529412,
      "frameId": "K0128",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "浅底",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "细丝近景",
      "end": 6.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.5,
      "label": "球形整体",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "ai 分支",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "生成与学习词",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "纹理切换",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "data 分支",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "能力词",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "governance 分支",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "治理词",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "母品牌",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "IBM",
      "end": 33.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 33.9,
  "fontFamily": "Arial, sans-serif"
}
```
