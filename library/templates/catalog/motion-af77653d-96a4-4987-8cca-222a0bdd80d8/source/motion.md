# We’re rolling out EURR, our first euro-backed stablecoin, in the Revolut app.

双币沿同一个托盘交换前后位置，文字固定，让动感集中在两枚主体之间。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.25,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.75,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "EURR",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#bcbcbc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "EURR",
        "accent": "#bcbcbc"
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

## 共同轨道，前后遮挡分开处理

托盘以斜视椭圆为稳定参照，两枚币沿同一环形路径运动。经过后方时视觉尺寸略小，前方略大；按深度排序绘制，避免远处对象压到近处。

```motion-demo
{
  "id": "clip-1",
  "title": "共同轨道，前后遮挡分开处理",
  "src": "demos/clip-1.html",
  "duration": 2.5999999999999996,
  "status": "authored",
  "description": "0.2–2.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 灰阶材质需要明确的轮廓差

深色币与浅色币形成辨识，托盘靠边缘高光与阴影分层。无衬线标题固定在上方，底部说明独立留白，不随旋转缩放。

## 可换成两种资产或成对产品

保留共享轨道、互换前后和固定文案。主体图案与标题可换，说明文字按新主题重新排版；三维效果优先采用可控材质与统一照明。

## 配色与字形

无衬线品牌主标题与细副标题；底部独立小字区。

#222222 · #f4f4f2 · #bcbcbc · #101010 · #777777

## 元素与制作规则

椭圆托盘 / 深色币 / 浅色币 / 顶部标题 / 底部说明

- 双币沿同一个托盘交换前后位置，文字固定，让动感集中在两枚主体之间。
- 托盘以斜视椭圆为稳定参照，两枚币沿同一环形路径运动。经过后方时视觉尺寸略小，前方略大；按深度排序绘制，避免远处对象压到近处。
- 深色币与浅色币形成辨识，托盘靠边缘高光与阴影分层。无衬线标题固定在上方，底部说明独立留白，不随旋转缩放。

## 内容替换

- 保留共享轨道、互换前后和固定文案。主体图案与标题可换，说明文字按新主题重新排版；三维效果优先采用可控材质与统一照明。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Revolut",
  "id": "V206",
  "palette": [
    "#222222",
    "#f4f4f2",
    "#bcbcbc",
    "#101010",
    "#777777"
  ],
  "typography": "无衬线品牌主标题与细副标题；底部独立小字区",
  "sample": "EURR",
  "objects": [
    "椭圆托盘",
    "深色币",
    "浅色币",
    "顶部标题",
    "底部说明"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/3f2fac973528399d9043c9899357a7d70834e15b851723af0e3b5364eba08a33",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/fd1b361697258c3b8ccab93cfb0d240863f1d33031cab7d8d6d79e1c1e3af5f3",
      "timeSeconds": 1.25,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/ad7df8e9b34b63d8f7a37aa6a30eb9b7216fd924b2b0f95243f20a40ddc586f5",
      "timeSeconds": 2.5,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d8b3d2a709db82cb9854d49fafc7f782e68ec3e4ff30c25ab23ddc648c22f0ca",
      "timeSeconds": 4.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "双币托盘",
      "end": 1.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.3,
      "label": "绕行前半",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "位置交换",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "绕行后半",
      "end": 5.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.25,
  "fontFamily": "Arial, sans-serif"
}
```
