# Custom Agents.

先让杂务堆起来，再让代理把它们分开完成。开头的拥挤与后半段的有序，是整支视频的主要反差。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 70.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Custom Agents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Custom Agents",
        "accent": "#2f91cb"
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

## 传送带从整齐变拥挤

任务纸条沿同一方向进入，逐渐缩短间距并产生轻微错位。保留稳定的传送带参照，观众才能看出工作量正在超过处理速度。

```motion-demo
{
  "id": "clip-1",
  "title": "传送带从整齐变拥挤",
  "src": "demos/clip-1.html",
  "duration": 13,
  "status": "authored",
  "description": "0–13 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 代理接管后建立任务归属

彩色角色进入时接走不同任务，纸条由堆积转成有间距的队列。用持续的颜色或图形关联角色与任务，避免每个场景重新分配身份。

## 看板、消息、报告是不同的完成方式

依次给出任务推进、回复和文档产物。每个成果前保留一次对应角色或任务提示；最后再合成深色并行网络，表现多路工作同时进行。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 任务传送带 |
| 7.00–13.00s | 任务堆积 |
| 13.00–19.00s | 告别杂务 |
| 19.00–25.00s | 代理进入 |
| 25.00–31.00s | 分配任务 |
| 31.00–37.00s | 看板推进 |
| 37.00–43.00s | 消息回复 |
| 43.00–50.00s | 报告生成 |
| 50.00–55.00s | 调度输入 |
| 55.00–67.00s | 深色任务网络 |
| 67.00–70.87s | 品牌 |

## 角色有颜色，工具保持轻量

前半用白底、深色无衬线标题和淡色任务纸条。角色可用明亮蓝、杏黄、紫色，工具界面保持细边框；后半转深底时提高文字和连接线对比度，不改变角色配色。

## 换成另一类工作负担

可以换成客服、运营或设计杂务。先列三类重复工作，再给各自可见的交付物；保留“积压→接管→分工完成”的反差，不要把代理仅当装饰角色。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

任务纸条 / 传送带 / 彩色代理角色 / 看板 / 消息 / 报告

- 开头任务从整齐流动变拥挤，代理接管后恢复有序分工，构成问题与解决的反差。
- 彩色角色对应任务类型，后半聚合成并行网络。

## 内容替换

- 可换杂务类型与角色；保留堆积→接管→并行完成的反差。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V085",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Custom Agents",
  "objects": [
    "任务纸条",
    "传送带",
    "彩色代理角色",
    "看板",
    "消息",
    "报告"
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
      "timeSeconds": 13.0,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 25.0,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 37.0,
      "frameId": "K0116",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 50.0,
      "frameId": "K0162",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 67.0,
      "frameId": "K0222",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "任务传送带",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "任务堆积",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "告别杂务",
      "end": 19,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19,
      "label": "代理进入",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "分配任务",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "看板推进",
      "end": 37,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37,
      "label": "消息回复",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "报告生成",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "调度输入",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "深色任务网络",
      "end": 67,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 67,
      "label": "品牌",
      "end": 70.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 70.866667,
  "fontFamily": "Arial, sans-serif"
}
```
