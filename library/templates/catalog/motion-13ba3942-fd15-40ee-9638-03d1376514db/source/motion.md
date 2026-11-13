# Persimmon — a model that simulates people

先用一张果实海报表现个体，再拉开成许多差异化样本；让粒子跨越海报边界，完成从个体到互动的叙事。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 14.875,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Persimmon",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#dc793e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Persimmon",
        "accent": "#dc793e"
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

## 单个样本要有可辨认的差异

暖白墙面上放一张竖海报，标题在上，柿子在中央，色点在底部。自然光与影子缓慢移动，果实由不同疏密的彩点组成。

## 从一个拉到多个，再让它们发生关系

拉远后整齐排列不同海报，保持相同版式而改变果实内部纹理。第二句主张出现时，彩点离开自己的海报向邻近区域流动。

```motion-demo
{
  "id": "clip-2",
  "title": "从一个拉到多个，再让它们发生关系",
  "src": "demos/clip-2.html",
  "duration": 6.5,
  "status": "authored",
  "description": "2.5–9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最终把素材简化成品牌符号

实物与海报同框后，切到奶油色底上的点状果实和产品名。新主题可换象征物，但一人、多样本、互动三步要由同一视觉元素贯穿。

## 配色与字形

轻衬线叙事句；小字标签与最后品牌名对齐。

#e9e8d9 · #303a30 · #dc793e · #82937b · #f4ecd9

## 元素与制作规则

柿子海报 / 颜色采样点 / 海报矩阵 / 粒子 / 实物果实 / 品牌字标

- 暖白墙面上放一张竖海报，标题在上，柿子在中央，色点在底部。自然光与影子缓慢移动，果实由不同疏密的彩点组成。
- 拉远后整齐排列不同海报，保持相同版式而改变果实内部纹理。第二句主张出现时，彩点离开自己的海报向邻近区域流动。
- 实物与海报同框后，切到奶油色底上的点状果实和产品名。新主题可换象征物，但一人、多样本、互动三步要由同一视觉元素贯穿。

## 内容替换

- 替换象征物与两句叙事；保留个体→群体差异→互动。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Humans&",
  "id": "V190",
  "palette": [
    "#e9e8d9",
    "#303a30",
    "#dc793e",
    "#82937b",
    "#f4ecd9"
  ],
  "typography": "轻衬线叙事句；小字标签与最后品牌名对齐",
  "sample": "Persimmon",
  "objects": [
    "柿子海报",
    "颜色采样点",
    "海报矩阵",
    "粒子",
    "实物果实",
    "品牌字标"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/82dd61cf631af4d4f43773aadb8059f4e594cabab14f2a0b0849a9593cfc9a39",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 2.866969273743017,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/249800efda0e56ec59b9b13f621d17adda5f3e259eb244e7a105aacbfe9f3ab3",
      "timeSeconds": 7.271298882681564,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/3316a827ab2533a013bae6b1539058b4ed1e9fb22240b325c57c9e8f9c9b9f55",
      "timeSeconds": 9.265712290502794,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/fbaed7156514210343ccc7db0973e6c43b2517eff44cd2a09dc34dafce38e00a",
      "timeSeconds": 9.972067039106145,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 12.96368715083799,
      "frameId": "K0043",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "单张个体海报",
      "end": 2.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.8,
      "label": "多人变体",
      "end": 7.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.2,
      "label": "相互作用",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "粒子逸出",
      "end": 9.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.2,
      "label": "实物连接",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "图形化果实",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "名称与主张",
      "end": 14.875,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 14.875,
  "fontFamily": "Georgia, serif"
}
```
