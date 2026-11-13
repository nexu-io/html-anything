# ChatGPT｜Apple Messages

把消息发送做成一条完整操作链：找到事项，形成草稿，让用户确认，再给出送达结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.033333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Apple Messages Plugin",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#32c761"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Apple Messages Plugin",
        "accent": "#32c761"
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

## 查询与结果保持短句

白底界面减少外围装饰，无衬线粗标题只在章节间出现。查询框、结果和确认弹层沿同一中心轴展开；绿色强调操作，蓝色用于目标聊天。

## 把审核留成一个完整状态

草稿出现后允许修改正文。确认按钮紧接正文下方，等编辑结束再点击；发送前后的内容保持一致。

```motion-demo
{
  "id": "clip-2",
  "title": "把审核留成一个完整状态",
  "src": "demos/clip-2.html",
  "duration": 8,
  "status": "authored",
  "description": "15–23 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 到目标聊天里展示结果

发送成功后切到接收方聊天，让同一句内容成为蓝色气泡。确认弹层与目标聊天承担不同任务，不把两者压成一个闪过的状态。

## 可替换的部分

可换插件、待办、草稿与接收渠道。用于发布工具时，把聊天回执换成已发布页面，仍保留人工确认这一步。

## 配色与字形

白底、无衬线粗标题、聊天绿蓝状态色。

#ffffff · #161a18 · #32c761 · #0789fa · #eeeeed

## 元素与制作规则

输入栏 / 检索结果 / 确认弹层 / 可编辑消息 / 目标聊天

- 查到待办后先展示建议，再由用户修改并确认，最后显示目标聊天收到消息。
- 确认弹层是发送的必经状态，不用光标一闪代替审核。
- 发送前后消息内容对应，蓝色气泡代表最终输出。

## 内容替换

- 迁移为发布工具：草稿→人工确认→发布目的地回执。
- 文案可替换，目标与发送内容必须一致。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "OpenAI",
  "id": "V009",
  "palette": [
    "#ffffff",
    "#161a18",
    "#32c761",
    "#0789fa",
    "#eeeeed"
  ],
  "typography": "白底、无衬线粗标题、聊天绿蓝状态色",
  "sample": "Apple Messages Plugin",
  "objects": [
    "输入栏",
    "检索结果",
    "确认弹层",
    "可编辑消息",
    "目标聊天"
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
      "timeSeconds": 8.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 12.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 17.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 22.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 28.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "功能名",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "输入查询",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "发现待回复事项",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "请求发送",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "强调发送前审核",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "修改回复内容",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "确认发送",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "目标聊天收到消息",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "可用范围与品牌",
      "end": 32.033333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.033333,
  "fontFamily": "Arial, sans-serif"
}
```
