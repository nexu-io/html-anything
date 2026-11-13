# Gemini｜品牌字标揭晓

把旧名称拆成一股粒子，让粒子沿同一方向聚成新字标。最终把新字标放进真实可使用的入口。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.076733,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 5.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Gemini",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#8068c5"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Gemini",
        "accent": "#8068c5"
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

## 明暗区分旧阶段与新身份

先用浅紫白底承载旧文字，短暂切黑强化转折。新字标采用粉蓝渐变，粒子继承它的颜色；字形保持开阔、简单，便于形成清楚轮廓。

## 粒子承担转化，而非装饰

文字解体后先形成有方向的流动，再逐渐靠近新字的位置。新名字可读后减少尾迹，给完整字标留一段稳定时间。

## 从字标回到产品

让完整名称缩成界面里的品牌入口，接上问候或主输入框。替换品牌时准备旧短句、新名称和一个产品落点，保持三者字号层级。

## 配色与字形

浅紫白背景、粉蓝渐变字标、粒子尾迹。

#efedf7 · #24232a · #8068c5 · #c05a8d · #5e87d7

## 元素与制作规则

旧文字 / 粒子群 / 新字标 / 星形符号 / 界面标题

- 旧文字解体为粒子，粒子带方向性流动后重组新名称。
- 明暗切换帮助分隔旧阶段与新身份。
- 字标完成后缩为界面中的品牌入口。

## 内容替换

- 适合更名或版本升级；保留旧状态→转化→新身份→可用界面。
- 新标题建议短词；粒子字形来自本地替代字体。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V018",
  "palette": [
    "#efedf7",
    "#24232a",
    "#8068c5",
    "#c05a8d",
    "#5e87d7"
  ],
  "typography": "浅紫白背景、粉蓝渐变字标、粒子尾迹",
  "sample": "Gemini",
  "objects": [
    "旧文字",
    "粒子群",
    "新字标",
    "星形符号",
    "界面标题"
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
      "timeSeconds": 3.7037,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 5.271933333333333,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 6.2729333333333335,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 8.274933333333333,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "新章节短句",
      "end": 3.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.8,
      "label": "黑底 Today",
      "end": 5.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.2,
      "label": "文字散成粒子",
      "end": 6.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.2,
      "label": "粒子凝成新字标",
      "end": 8.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.2,
      "label": "进入产品界面",
      "end": 10.076733,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.076733,
  "fontFamily": "Arial, sans-serif"
}
```
