# Wonderful｜融资公告动效

先把融资金额做成视觉事件，再用投资方和全球覆盖解释这次增长，最后回到产品定位。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.84,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "$550M",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#92b8a5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "$550M",
        "accent": "#92b8a5"
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

## 金额从超画幅缩成完整公告

开头数字超出边缘，竖向叠影和快速缩放把它收进中心。背景是低细节的风景色带，品牌与轮次分别落在金额上下；金额停住后背景才切成彩色竖幅。

```motion-demo
{
  "id": "clip-1",
  "title": "金额从超画幅缩成完整公告",
  "src": "demos/clip-1.html",
  "duration": 4.6,
  "status": "authored",
  "description": "0–4.6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 名单与地图承担可信的细节

投资方以两列文字和细色线连接，不用堆 Logo。全球段先出现少量地点照片，再让数字递增，最后展开地图与更多照片。照片和地点数量要对应叙事。

## 高密度信息之后回到安静字标

白底名单和地图与深灰开头、结尾交替。数字用大号细无衬线，辅文显著缩小但保持可读；风景采用低饱和绿棕蓝，避免抢过白字。

## 替换数字与地点，保持事实一致

可用于融资、用户增长或覆盖范围公告。替换金额、轮次、名单、国家计数与地点素材，不沿用旧数字；结尾说明这些增长服务于什么产品。

## 配色与字形

无衬线超大细数字，融资轮次与品牌小字置于上下；窄字距干净排布。

#242424 · #fafaf6 · #92b8a5 · #bd8f6c · #8caaca

## 元素与制作规则

超大金额 / 模糊风景带 / 投资方名单 / 国家数字 / 地图照片 / 品牌字标

- 先把融资金额做成视觉事件，再用投资方和全球覆盖解释这次增长，最后回到产品定位。
- 开头数字超出边缘，竖向叠影和快速缩放把它收进中心。背景是低细节的风景色带，品牌与轮次分别落在金额上下；金额停住后背景才切成彩色竖幅。
- 投资方以两列文字和细色线连接，不用堆 Logo。全球段先出现少量地点照片，再让数字递增，最后展开地图与更多照片。照片和地点数量要对应叙事。

## 内容替换

- 可用于融资、用户增长或覆盖范围公告。替换金额、轮次、名单、国家计数与地点素材，不沿用旧数字；结尾说明这些增长服务于什么产品。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Wonderful",
  "id": "V391",
  "palette": [
    "#242424",
    "#fafaf6",
    "#92b8a5",
    "#bd8f6c",
    "#8caaca"
  ],
  "typography": "无衬线超大细数字，融资轮次与品牌小字置于上下；窄字距干净排布",
  "sample": "$550M",
  "objects": [
    "超大金额",
    "模糊风景带",
    "投资方名单",
    "国家数字",
    "地图照片",
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
      "timeSeconds": 1.52,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/4a554364eb553abd0b03870d9fcf2c91f9821936bb0e284eaebb1799efa07016",
      "timeSeconds": 10.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/20db693d406a1943e1059821dc9ff36e0400d6b9a5ea17b0b47eda3279823261",
      "timeSeconds": 12.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 16.0,
      "frameId": "K0046",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "超大金额",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "金额叠影",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "金额居中",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "彩色竖幅",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "投资方",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "全球主张",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "国家数递增",
      "end": 10.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.8,
      "label": "地图与照片",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "and counting",
      "end": 13.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.2,
      "label": "产品定位",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "品牌",
      "end": 17.84,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.84,
  "fontFamily": "Arial, sans-serif"
}
```
