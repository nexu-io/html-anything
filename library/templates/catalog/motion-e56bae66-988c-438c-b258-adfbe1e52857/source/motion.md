# Notion — the backbone of your dock

背景和周边工具不断更换，核心品牌图标始终存在。最后收掉环境，让观众只记住那个不变的中心。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 18.7,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Any tool. Any agent.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Any tool. Any agent.",
        "accent": "#2f91cb"
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

## 先固定 Dock 的观看位置

多种桌面快速切换时，Dock 保持同一水平基线与相近占幅。核心图标在每段都可辨认，周边应用和壁纸承担变化。

## 外围退出，留下核心图标

后半段停止生态轮换，逐步减少周边图标与背景信息，再放短句和品牌。收尾留白比开场更大，核心图标不需要额外复杂动作。

## 适配多种壁纸的图标与字

桌面可丰富，Dock 容器保持轻量与足够对比。品牌短句使用中粗无衬线，图标维持统一视觉尺寸；黑白作为稳定基底，蓝、杏、紫等颜色来自外围应用与背景。

## 先选不变量，再选变化项

迁移时先确定必须反复出现的服务或工具，再准备周边应用和环境。核心图标的轮廓与位置跨镜头保持连续，最后品牌页沿用同一图标。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

Dock 容器 / 核心品牌图标 / 周边应用 / 背景素材

- 桌面背景和周边应用快速替换，核心图标始终可辨认；最后其余元素退出，仅剩品牌。
- 共同的横向 Dock 维持跨镜头视觉连续。

## 内容替换

- 可换生态应用；保留核心服务作为不变量。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V091",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Any tool. Any agent.",
  "objects": [
    "Dock 容器",
    "核心品牌图标",
    "周边应用",
    "背景素材"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/b1a5e800a2c767a0f0f28d983d14bb2404dbe716360df1bfe6bc9cd01974c450",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/86ebf4713b12ab8aa2e9722d09f2385400b5bd3eb6a6bf18fefe84ac9ead7fa7",
      "timeSeconds": 3.0,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/ac0039f0022ea7a1114f68f125e1af0fc76215da32558a15cf4c689715139023",
      "timeSeconds": 7.0,
      "frameId": "K0049",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 11.0,
      "frameId": "K0070",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0079",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 16.0,
      "frameId": "K0082",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "多种桌面 Dock",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "图标序列切换",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "背景与图标变化",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "核心图标聚焦",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "短句",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "品牌图标",
      "end": 18.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 18.7,
  "fontFamily": "Arial, sans-serif"
}
```
