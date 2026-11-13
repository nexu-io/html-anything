# Manus Agents — your personal Manus, now inside your…

让助手待在用户熟悉的聊天里。先通过对话建立关系，再发送参考素材、接收成果，并短暂走出聊天窗口看完整结果。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 37.066667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Your agent in chats",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Your agent in chats",
        "accent": "#538cbe"
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

## 手机始终是任务入口

手机放在画面中心，两侧只保留简短功能提示。联系人、聊天头像和消息方向保持一致，文本采用常规无衬线字；浅背景和深色设备边框提供稳定轮廓。

前段先展示助手的交流方式，再发送一张具体参考图。不要同时把语音、日程、视频能力都塞进首屏。

![0.00s · 构图参考](assets/reference-1.jpg)

## 从一条结果卡，展开到完整作品

用户发送素材后，助手返回带相同主体的成果卡。将卡片扩大或直接切入完整画面，让观众看到真正的内容；作品播放完再回到同一部手机。

素材里的主体应在成果中仍可辨认。聊天上下文负责说明任务，独立播放负责展示质量，二者不要互相挤占画面。

## 回到聊天，继续交代其他入口

完整结果后，再展示语音输入、重复任务与工具成果。各能力保持一次输入、一次回应的短回合，末尾用平台标记交代可使用的位置。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 聊天联系人 |
| 4.00–8.00s | 个性化对话 |
| 8.00–11.00s | 发送参考图 |
| 11.00–13.00s | 生成结果 |
| 13.00–20.00s | 结果独立播放 |
| 20.00–23.00s | 语音入口 |
| 23.00–27.00s | 重复任务 |
| 27.00–32.00s | 工具结果 |
| 32.00–35.00s | 聊天平台集合 |
| 35.00–37.07s | 品牌 |

## 替换为设计或业务助手

可以发送产品图、页面草图或会议资料，再返回视频、方案或摘要。品牌、联系人、素材和成果一起换，保留聊天与独立成果之间的往返。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

聊天手机 / 输入素材 / 输出视频 / 语音按钮 / 平台图标

- 助手存在于原聊天容器内，发送素材后返回结果卡
- 结果从聊天卡扩展为独立画面播放，再回到手机演示其他能力
- 文字标注分置两侧，手机作为持续锚点

## 内容替换

- 可迁移到设计助手在聊天中接收参考并返回成果
- 保留素材→处理→结果的身份关联，换主题需更换结果素材

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V047",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Your agent in chats",
  "objects": [
    "聊天手机",
    "输入素材",
    "输出视频",
    "语音按钮",
    "平台图标"
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
      "path": "https://r.open-design.ai/files/8515c6942de1189ca517890b60074b5bdc18210455facc53a1e2fcae54efb1fb",
      "timeSeconds": 8.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/fa37e3b80b5c1e6fe39328b943613d7f3bdd7db8a2a84be49e2a43a90154c706",
      "timeSeconds": 20.0,
      "frameId": "K0070",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/75d461d1c2b904b767bd3c3af177c9ff90d881c6ba18ce863b79bc8b59cc9c72",
      "timeSeconds": 27.0,
      "frameId": "K0088",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 35.0,
      "frameId": "K0116",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "聊天联系人",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "个性化对话",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "发送参考图",
      "end": 11.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11.0,
      "label": "生成结果",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "结果独立播放",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "语音入口",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "重复任务",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "工具结果",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "聊天平台集合",
      "end": 35.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35.0,
      "label": "品牌",
      "end": 37.066667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 37.066667,
  "fontFamily": "Arial, sans-serif"
}
```
