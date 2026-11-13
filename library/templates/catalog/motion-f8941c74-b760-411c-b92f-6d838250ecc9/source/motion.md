# 九十年代浏览器拼贴

用一句关于网络记忆的短句作为中轴，先叠入知识插画，再叠入早期网页，让内容积累自然过渡到浏览器时代。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.7057,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "The web is humanity’s living memory",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#3367bc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "The web is humanity’s living memory",
        "accent": "#3367bc"
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

## 开头给文字留完整的纸面

奶油色底配深色文字，游标先出现，再从左向右输入一句话。句子居中偏上，图像加入前至少形成可以读懂的短语。

## 拼贴按媒介顺序加密

解剖、自然与天文插画先作为纸片进入，随后换成早期网页和灰色浏览器边框。新窗口覆盖部分旧内容但保留边缘，密度越来越高，中心主张不必一直保持最前。

```motion-demo
{
  "id": "clip-2",
  "title": "拼贴按媒介顺序加密",
  "src": "demos/clip-2.html",
  "duration": 2.7,
  "status": "authored",
  "description": "3–5.7 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用素材家族替换，而不是随意填图

新主题准备三至五类有时间关系的资料：早期记录、图解、网页与工具。维持纸白、黑字、链接蓝与灰边框，数量通过叠放增加，不缩成规整九宫格。

## 配色与字形

开场打字机短句；后段采用早期浏览器的小字、蓝链接和灰色立体边框。

#eeeae0 · #171717 · #3367bc · #9b978c · #c2c7c8

## 元素与制作规则

打字游标 / 主张句 / 历史插画 / 纸页 / 早期网页 / 浏览器窗

- 奶油色底配深色文字，游标先出现，再从左向右输入一句话。句子居中偏上，图像加入前至少形成可以读懂的短语。
- 解剖、自然与天文插画先作为纸片进入，随后换成早期网页和灰色浏览器边框。新窗口覆盖部分旧内容但保留边缘，密度越来越高，中心主张不必一直保持最前。
- 新主题准备三至五类有时间关系的资料：早期记录、图解、网页与工具。维持纸白、黑字、链接蓝与灰边框，数量通过叠放增加，不缩成规整九宫格。

## 内容替换

- 替换知识史或产品史的资料；保留文字→纸面资料→网页窗口的积累。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Parallel Web Systems",
  "id": "V335",
  "palette": [
    "#eeeae0",
    "#171717",
    "#3367bc",
    "#9b978c",
    "#c2c7c8"
  ],
  "typography": "开场打字机短句；后段采用早期浏览器的小字、蓝链接和灰色立体边框",
  "sample": "The web is humanity’s living memory",
  "objects": [
    "打字游标",
    "主张句",
    "历史插画",
    "纸页",
    "早期网页",
    "浏览器窗"
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
      "timeSeconds": 2.0020000000000002,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.003,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 3.336666666666667,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/2ee144edf7c0168f787ede8f5403520d681372db38bc2eed822c89c5a638c521",
      "timeSeconds": 4.270933333333334,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/26f61912cbfb2d65d65b256309f8acfe89fe1ac25f5a8acca338743428367cf0",
      "timeSeconds": 5.005,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "空白与游标",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "开始输入",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "完整主张",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "知识插画",
      "end": 4.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.2,
      "label": "早期网页",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "窗口叠满",
      "end": 5.7057,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.7057,
  "fontFamily": "Arial, sans-serif"
}
```
