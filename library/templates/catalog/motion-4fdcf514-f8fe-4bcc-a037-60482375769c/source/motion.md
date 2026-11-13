# 钱包补充资金的插画循环

把“加油”动作借给钱包：枪口对准、金币流入、钱包充盈，动作本身解释充值含义。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 4.8,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Refill your wallet",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4d77e6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Refill your wallet",
        "accent": "#4d77e6"
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

## 枪口先对准，钱币再进入

手臂与枪体作为一组移动，喷口指向钱包开口后才出现金币。金币沿短弧线落下，纸币后出现；钱包位置稳定，充盈只改变内部内容。

```motion-demo
{
  "id": "clip-1",
  "title": "枪口先对准，钱币再进入",
  "src": "demos/clip-1.html",
  "duration": 1.7,
  "status": "authored",
  "description": "0.3–2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 平面插画也需要明确遮挡

深蓝底与亮蓝钱包、金黄色钱币形成对比。钱币先在钱包后方升起，再被前袋遮住底部；手的肤色只占小面积，白色枪口引导方向。

## 可迁移为能量或资源补充

换主题时保留来源、流入路径和接收容器。可换成电量、积分或素材补充；图标含义需与接收对象一致，不额外堆放装饰性文字。

## 配色与字形

无正文插画；可增小号无衬线说明，主体用平面色块。

#10295a · #f5f3e9 · #4d77e6 · #d7a647 · #e6b99c

## 元素与制作规则

手与加油枪 / 弯曲枪口 / 蓝色钱包 / 金币与纸币

- 把“加油”动作借给钱包：枪口对准、金币流入、钱包充盈，动作本身解释充值含义。
- 手臂与枪体作为一组移动，喷口指向钱包开口后才出现金币。金币沿短弧线落下，纸币后出现；钱包位置稳定，充盈只改变内部内容。
- 深蓝底与亮蓝钱包、金黄色钱币形成对比。钱币先在钱包后方升起，再被前袋遮住底部；手的肤色只占小面积，白色枪口引导方向。

## 内容替换

- 换主题时保留来源、流入路径和接收容器。可换成电量、积分或素材补充；图标含义需与接收对象一致，不额外堆放装饰性文字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Uber",
  "id": "V332",
  "palette": [
    "#10295a",
    "#f5f3e9",
    "#4d77e6",
    "#d7a647",
    "#e6b99c"
  ],
  "typography": "无正文插画；可增小号无衬线说明，主体用平面色块",
  "sample": "Refill your wallet",
  "objects": [
    "手与加油枪",
    "弯曲枪口",
    "蓝色钱包",
    "金币与纸币"
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
      "timeSeconds": 0.64,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 0.96,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 1.6,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 2.88,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 3.84,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "加油枪与空钱包",
      "end": 0.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.6,
      "label": "枪口对准",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "金币进入",
      "end": 1.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.6,
      "label": "纸币出现",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "钱包充盈",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "停留",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 4.8,
  "fontFamily": "Arial, sans-serif"
}
```
