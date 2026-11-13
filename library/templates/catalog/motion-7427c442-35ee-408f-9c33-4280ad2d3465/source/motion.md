# ChatGPT Images 2.6

用一组动态图展示范围，再聚焦同一主体的修改。卡片负责浏览节奏，卡片里的角色负责内容变化。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 35.066762,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Images 2.6",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#db65aa"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Images 2.6",
        "accent": "#db65aa"
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

## 容器统一，素材保持差异

白底上使用统一圆角和边距，彩色素材承担主要视觉变化。标题与提示用简洁无衬线，留在卡片外侧，避免盖住主体。

## 先看一个，再浏览一组

第一个动图建立内容形式，随后横移展开更多卡片。扇转时保留每张卡的边界，卡内动画照常播放，不跟随容器一起停住。

```motion-demo
{
  "id": "clip-2",
  "title": "先看一个，再浏览一组",
  "src": "demos/clip-2.html",
  "duration": 11,
  "status": "authored",
  "description": "2–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 修改要落在刚才那个主体上

聚焦单张卡后再给局部要求，让同一角色增加特效。速度控件出现时，角色动作的快慢随之变化，卡片位置维持稳定。

```motion-demo
{
  "id": "clip-3",
  "title": "修改要落在刚才那个主体上",
  "src": "demos/clip-3.html",
  "duration": 10,
  "status": "authored",
  "description": "13–23 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 回到集合，再收成单例

修改后的卡片回到素材集合，最后用一张代表作品和品牌收尾。

## 换素材时检查两个运动层级

可换角色、图片类别、特效与提示词。容器进出和内部动画分开安排：前者引导浏览，后者表达内容本身。

## 配色与字形

白底圆角素材卡、彩色动物与亮色特效。

#ffffff · #161916 · #db65aa · #5d95ba · #cfb88b

## 元素与制作规则

输入气泡 / 素材卡队列 / 主体动物 / 特效 / 速度控件

- 先展示静态需求到动态图，再用卡片横移扩展能力范围。
- 再次输入局部要求后同一主体增加特效，证明可迭代编辑。
- 卡片容器运动与卡内角色动画独立。

## 内容替换

- 换主题应提供同一素材的前后编辑对照。
- 保留示例扩展→局部修改→参数调节。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V326",
  "palette": [
    "#ffffff",
    "#161916",
    "#db65aa",
    "#5d95ba",
    "#cfb88b"
  ],
  "typography": "白底圆角素材卡、彩色动物与亮色特效",
  "sample": "Images 2.6",
  "objects": [
    "输入气泡",
    "素材卡队列",
    "主体动物",
    "特效",
    "速度控件"
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
      "timeSeconds": 5.000013624841571,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 9.00002452471483,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 17.000046324461344,
      "frameId": "K0062",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 19.00005177439797,
      "frameId": "K0069",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/d2e299b6f5e0dc6b59f29bf6242cfa4ebbcda220f353d21768acaa4cc5a3f9ff",
      "timeSeconds": 28.000076299112802,
      "frameId": "K0107",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "输入入口",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "首个动图",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "多素材横移",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "卡片扇转",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "两对象对照",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "提示增添特效",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "调整速度",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "更多案例",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "单例收束与落版",
      "end": 35.066762,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 35.066762,
  "fontFamily": "Arial, sans-serif"
}
```
