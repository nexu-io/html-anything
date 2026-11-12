# ElevenMusic — Today we are launching ElevenMusic, a…

从音乐库中的一首歌进入创作，再把视角拉回一整片作品。单首与集合之间来回切换，展示浏览、选择和扩展的关系。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 40.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Eleven Music",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#b9471c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Eleven Music",
        "accent": "#b9471c"
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

## 先让音乐库像一个可使用的产品

列表里封面、歌名、播放状态与波形各有稳定位置。被选中的歌曲从列表浮出，其名称与封面继续保留，成为下一段的焦点。

深色底配橙、青和暖金色，封面承担主要色彩。歌名用清晰无衬线字，元信息较轻，播放时间与参数使用对齐数字。

## 从一首歌长出不同方向

输入创作要求后，风格或情绪标签向外分叉。选择标签再出现新结果，标签与新作品的关系应能读懂，不能只做一圈装饰性气泡。

## 封面从列表变成空间

前段使用平面的列表秩序，中后段让封面叠放、分散、远近移动，表达作品数量。完整可读的单封面与快速展开的封面墙交替，避免始终只有小缩略图。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 品牌 |
| 2.00–4.00s | 音乐库 |
| 4.00–7.00s | 条目浮出 |
| 7.00–9.00s | 封面与波形 |
| 9.00–13.00s | 输入创作 |
| 13.00–17.00s | 风格分支 |
| 17.00–20.00s | 歌单列表 |
| 20.00–25.00s | 创作入口 |
| 25.00–29.00s | 创作者与数量 |
| 29.00–33.00s | 封面叠放 |
| 33.00–37.00s | 作品空间 |
| 37.00–40.00s | 品牌 |

## 替换一套有连续身份的内容

为新主题准备曲目、封面、作者与创作提示。单首、变体和合集的名称要一致，音轨与波形播放需要同一时间基准；品牌标记留给末尾收束。

## 配色与字形

无衬线界面文字与清晰大小层级。

#101010 · #ffffff · #b9471c · #239993 · #f1b46b

## 元素与制作规则

音乐库 / 歌曲条目 / 封面 / 波形 / 提示框 / 风格标签 / 创作者数 / 作品墙

- 从已有音乐库聚焦一首歌，再通过提示和风格标签扩展更多作品
- 列表、单封面、作品墙是同一资产不同层级，身份应可追踪
- 深色UI与道路实拍、橙蓝色场景交替

## 内容替换

- 用于内容平台时保留浏览→选择→生成→规模的视角变化
- 替换封面与内容目录，不把规模数字作为默认事实

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "ElevenLabs",
  "id": "V064",
  "palette": [
    "#101010",
    "#ffffff",
    "#b9471c",
    "#239993",
    "#f1b46b"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Eleven Music",
  "objects": [
    "音乐库",
    "歌曲条目",
    "封面",
    "波形",
    "提示框",
    "风格标签",
    "创作者数",
    "作品墙"
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
      "timeSeconds": 4.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/70d5bedede3bf9f97fd8b1c4176fb840fcb39d0ade02adff730eb9d8f349193c",
      "timeSeconds": 9.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 20.0,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 29.0,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 37.0,
      "frameId": "K0113",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "品牌",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "音乐库",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "条目浮出",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "封面与波形",
      "end": 9.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.0,
      "label": "输入创作",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "风格分支",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "歌单列表",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "创作入口",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "创作者与数量",
      "end": 29.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29.0,
      "label": "封面叠放",
      "end": 33.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 33.0,
      "label": "作品空间",
      "end": 37.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37.0,
      "label": "品牌",
      "end": 40.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 40.0,
  "fontFamily": "Arial, sans-serif"
}
```
