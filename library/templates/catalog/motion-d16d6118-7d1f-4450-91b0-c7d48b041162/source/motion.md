# Uber Go Get It｜品牌图形动效片段

重复行李箱围绕固定短句滑动与翻转，让旅行主张在连续图案中保持可读。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 4.8,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "PLAN ON A GOOD TIME",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f14e32"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "PLAN ON A GOOD TIME",
        "accent": "#f14e32"
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

## 同一箱体用不同位置形成图案

各箱保持相同透视，斜向平移时使用一致间距。拉杆先伸出，再整体翻转；画面边缘的箱体允许裁切，中心短句保留主要阅读区。

```motion-demo
{
  "id": "clip-1",
  "title": "同一箱体用不同位置形成图案",
  "src": "demos/clip-1.html",
  "duration": 1.9,
  "status": "authored",
  "description": "2.6–4.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 冷色产品与暖色文字分层

浅青背景、深蓝箱体和橙红大写短句形成三层。标题用粗无衬线分两行，箱体可短暂遮挡局部字，但不能长时间盖住整句。

## 更换旅行或出行物件

可换背包、鞋或票夹，使用可辨的统一物件。短句不超过两行，循环的始末位置对齐，重复物件不要随机改变颜色与尺度。

## 配色与字形

无衬线大写两行短句；固定中心，产品重复成倾斜图案。

#bceae6 · #233e5e · #f14e32 · #6d819b · #eff6ec

## 元素与制作规则

重复行李箱 / 拉杆 / 中心短句 / 倾斜排列

- 重复行李箱围绕固定短句滑动与翻转，让旅行主张在连续图案中保持可读。
- 各箱保持相同透视，斜向平移时使用一致间距。拉杆先伸出，再整体翻转；画面边缘的箱体允许裁切，中心短句保留主要阅读区。
- 浅青背景、深蓝箱体和橙红大写短句形成三层。标题用粗无衬线分两行，箱体可短暂遮挡局部字，但不能长时间盖住整句。

## 内容替换

- 可换背包、鞋或票夹，使用可辨的统一物件。短句不超过两行，循环的始末位置对齐，重复物件不要随机改变颜色与尺度。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Uber",
  "id": "V219",
  "palette": [
    "#bceae6",
    "#233e5e",
    "#f14e32",
    "#6d819b",
    "#eff6ec"
  ],
  "typography": "无衬线大写两行短句；固定中心，产品重复成倾斜图案",
  "sample": "PLAN ON A GOOD TIME",
  "objects": [
    "重复行李箱",
    "拉杆",
    "中心短句",
    "倾斜排列"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/ef6ea37dfa600a8d944b92528a161a43685cce7d33e5e84e5d6338d961920f92",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c588ec4b3b51346abada7f4c1d14f57f24b0adeb573ba59071ed0574ee47510e",
      "timeSeconds": 0.96,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0590fa98ea17ff9bea4847024be5d0ba97a6977b36ef481539f53c178dd1d6e8",
      "timeSeconds": 2.56,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0603b2036b0fa9e07fcac61744f53fc1c92b5bfe749f6808dc70c8c13d61f27c",
      "timeSeconds": 3.2,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/112a97431da447645e575258d36b7b850d3d8f97dc66cb20c41bdf20ec1b5966",
      "timeSeconds": 4.48,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "箱体阵列",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "拉杆伸出",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "箱体平移",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "翻转",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "回到阵列",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 4.8,
  "fontFamily": "Arial, sans-serif"
}
```
