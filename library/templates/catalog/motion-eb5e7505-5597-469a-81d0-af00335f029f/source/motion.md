# Cloud Computer：部署与使用云电脑

围绕一台持续存在的云电脑安排演示：建立环境，查看资源，再把它用于部署和运行服务。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 47.966667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 11.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Cloud Computer",
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
        "title": "Cloud Computer",
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

## 先给电脑一个明确的状态

入口页交代这是可工作的云端环境，随后出现资源面板。CPU、内存、文件与连接信息用整齐的数值和图表排布；系统名称和运行状态始终可见。

画面以浅色工作区为主，蓝色用于当前控制与图表；标题略粗，资源数字与单位分层排列。不要给每个读数都加夸张跳动。

## 资源面板之后，展示一件真实工作

选择部署机器人、运行采集任务或搭建数据服务中的具体任务。按输入请求、执行反馈、打开成果推进，让服务页面成为云电脑工作的结果。

## 服务之间有变化，工作环境保持稳定

切换案例时沿用同一个应用外框或入口位置，只改变内部任务与成果。关键配置可以推近，完成后回到全局窗口，避免连续大幅推拉让人失去位置。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 云电脑介绍 |
| 6.00–10.00s | 创建入口 |
| 10.00–15.00s | 资源与连接 |
| 15.00–20.00s | 机器人请求 |
| 20.00–23.00s | 部署结果 |
| 23.00–27.00s | 持续任务 |
| 27.00–32.00s | 资讯抓取 |
| 32.00–36.00s | 开源工具生态 |
| 36.00–43.00s | 部署数据应用 |
| 43.00–45.00s | 运行成果 |
| 45.00–47.97s | 品牌 |

## 迁移为另一类云工作台

保留环境、资源、任务、在线结果四层信息。更换部署目标时补齐对应的输入、执行状态和结果页面，不沿用与新服务无关的资源文案。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

云容器 / 输入框 / 资源面板 / 任务过程 / 部署结果

- 先解释持久执行环境，再用机器人、抓取、部署三个实例证明
- 每例从请求切到执行证据，再给可访问成果
- 工具图标环绕后汇聚为输入资源

## 内容替换

- 换主题保留环境→任务→持久结果的逻辑
- 替换服务名与输出内容，保持不同任务的成果形态

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V048",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Cloud Computer",
  "objects": [
    "云容器",
    "输入框",
    "资源面板",
    "任务过程",
    "部署结果"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/d0755239ef44c456f2ed95c2ea36c86bf0b300905942945d990c1288135b4ebe",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 10.006954102920723,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0e0ca3b8992224bdf3813c30e8fe52532c7ad95c2ea99946142c0bfb1c7eb4be",
      "timeSeconds": 20.013908205841446,
      "frameId": "K0051",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0512ee42bf13589d204a3e5ec7ee061607d4bd477427b7822d64ac47cab020b9",
      "timeSeconds": 27.018776077885953,
      "frameId": "K0072",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 36.02503477051461,
      "frameId": "K0101",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 45.03129346314326,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "云电脑介绍",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.0,
      "label": "创建入口",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "资源与连接",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "机器人请求",
      "end": 20.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20.0,
      "label": "部署结果",
      "end": 23.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23.0,
      "label": "持续任务",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "资讯抓取",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "开源工具生态",
      "end": 36.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36.0,
      "label": "部署数据应用",
      "end": 43.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43.0,
      "label": "运行成果",
      "end": 45.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45.0,
      "label": "品牌",
      "end": 47.966667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 47.966667,
  "fontFamily": "Arial, sans-serif"
}
```
