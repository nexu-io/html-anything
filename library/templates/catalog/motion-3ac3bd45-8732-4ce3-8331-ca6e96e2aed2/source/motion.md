# Parallel Index — get paid when AI uses your content

用节点的组织方式讲网络变化：先是开放连接，再出现新的访问者，随后从单次访问扩成大规模流量，最终收成索引标志。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 95.933333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 58,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Index by Parallel",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed6429"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Index by Parallel",
        "accent": "#ed6429"
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

## 早期网络用稀疏连接讲清楚

纸白底上将几个彩色节点围绕中心摆开，细线形成关系。历史感来自小字、纸边和有限颜色，避免用密集装饰抢占节点。

## 新访问者改变同一套网络

橙色节点进入后，连线与流向重新安排。先展示一个请求，再增加到成排小点；节点颜色与位置要能解释角色变化。

```motion-demo
{
  "id": "clip-2",
  "title": "新访问者改变同一套网络",
  "src": "demos/clip-2.html",
  "duration": 7,
  "status": "authored",
  "description": "23–30 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 数量增大时用组织形态换节奏

单点、点阵、巨大的裁切圆、网格地球依次交接。黑白与橙色整场切换控制段落，形状仍围绕中心或固定轴线组织。

```motion-demo
{
  "id": "clip-3",
  "title": "数量增大时用组织形态换节奏",
  "src": "demos/clip-3.html",
  "duration": 6,
  "status": "authored",
  "description": "40–46 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 从网络规模收回创作者与代理

地球网格缩成条纹圆标，随后再把彩色个体加入网络。结尾恢复纸白与简短主张，让长片的最后一幕比中段清楚。

| 时间 | 段落 |
|---|---|
| 0.00–9.00s | 网络记忆 |
| 9.00–16.00s | 早期网络 |
| 16.00–23.00s | 开放连接 |
| 23.00–30.00s | 新的节点 |
| 30.00–40.00s | 访问流 |
| 40.00–50.00s | 从一到多 |
| 50.00–57.00s | 无点击 |
| 57.00–67.00s | 全球网络 |
| 67.00–74.00s | 索引标志 |
| 74.00–88.00s | 创作者与代理 |
| 88.00–94.00s | 开放网络主张 |
| 94.00–95.93s | 品牌 |

## 替换题材要保留角色与关系

可换其他基础设施叙事，但要先定义谁提供内容、谁发起访问、谁连接双方。品牌纹样从节点或线条推导，不突然插入无关标志。

## 配色与字形

小字号等宽叙事与短品牌字；图形密度承担节奏变化。

#efeee9 · #111111 · #ed6429 · #64959a · #bcbd79 · #989ac8

## 元素与制作规则

纸面 / 网络节点 / 连线 / 橙色节点 / 点阵 / 地球网格 / 索引纹样 / 品牌字

- 纸白底上将几个彩色节点围绕中心摆开，细线形成关系。历史感来自小字、纸边和有限颜色，避免用密集装饰抢占节点。
- 橙色节点进入后，连线与流向重新安排。先展示一个请求，再增加到成排小点；节点颜色与位置要能解释角色变化。
- 单点、点阵、巨大的裁切圆、网格地球依次交接。黑白与橙色整场切换控制段落，形状仍围绕中心或固定轴线组织。
- 地球网格缩成条纹圆标，随后再把彩色个体加入网络。结尾恢复纸白与简短主张，让长片的最后一幕比中段清楚。
- 可换其他基础设施叙事，但要先定义谁提供内容、谁发起访问、谁连接双方。品牌纹样从节点或线条推导，不突然插入无关标志。

## 内容替换

- 替换网络角色、机制与品牌；保留稀疏连接→规模扩展→关系重组。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Parallel Web Systems",
  "id": "V199",
  "palette": [
    "#efeee9",
    "#111111",
    "#ed6429",
    "#64959a",
    "#bcbd79",
    "#989ac8"
  ],
  "typography": "小字号等宽叙事与短品牌字；图形密度承担节奏变化",
  "sample": "Index by Parallel",
  "objects": [
    "纸面",
    "网络节点",
    "连线",
    "橙色节点",
    "点阵",
    "地球网格",
    "索引纹样",
    "品牌字"
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
      "path": "https://r.open-design.ai/files/a85508a8c7c60634167d3ea0bcb3bce5c1ad85b973ce6ca080f8486a77777a0a",
      "timeSeconds": 16.0,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/9df4a40d2491bd59f3e17bf611ecd39117300410e3966593f95c2a6a1a7dc73a",
      "timeSeconds": 30.0,
      "frameId": "K0071",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/3dd954dcc761666f0dfbaf1db99699a8383780e4f2f6eca672c96470762587b7",
      "timeSeconds": 57.0,
      "frameId": "K0132",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 74.0,
      "frameId": "K0176",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 94.0,
      "frameId": "K0210",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "网络记忆",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "早期网络",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "开放连接",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "新的节点",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "访问流",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "从一到多",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "无点击",
      "end": 57,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 57,
      "label": "全球网络",
      "end": 67,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 67,
      "label": "索引标志",
      "end": 74,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 74,
      "label": "创作者与代理",
      "end": 88,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 88,
      "label": "开放网络主张",
      "end": 94,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 94,
      "label": "品牌",
      "end": 95.933333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 95.933333,
  "fontFamily": "ui-monospace, monospace"
}
```
