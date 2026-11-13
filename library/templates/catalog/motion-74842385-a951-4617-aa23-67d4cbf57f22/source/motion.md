# Perplexity｜Windows 本地计算

用一次安装和一次云协作，把“在本机运行，再按需扩展”的产品路径讲清楚。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 32.533333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Portable Computer",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4d9d9a"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Portable Computer",
        "accent": "#4d9d9a"
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

## 安装完成，工具网络才展开

下载按钮、进度条和启动状态依次出现。进度达到终点后再展开本地节点，工具网络从设备附近长出，作为安装成功的结果。

```motion-demo
{
  "id": "clip-1",
  "title": "安装完成，工具网络才展开",
  "src": "demos/clip-1.html",
  "duration": 11,
  "status": "authored",
  "description": "3–14 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 确认动作连接云与本地

先出现云协作主张，再展示确认弹窗。确认后云节点进入上层，连接线落回本地设备；保持上下层次和明确方向，让用户知道动作从哪里发起。

```motion-demo
{
  "id": "clip-2",
  "title": "确认动作连接云与本地",
  "src": "demos/clip-2.html",
  "duration": 15,
  "status": "authored",
  "description": "14–29 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 深底界面，少量连接色

深灰黑作为大背景，白色文字保留清楚的标题层级，青绿色用于节点和连接。主张标题采用衬线，安装项与弹窗采用无衬线；弹窗居于操作焦点，本地设备保持在下方参照位。

## 迁移成其他平台安装说明

可以换操作系统、设备与工具名，安装按钮和提示文案随之替换。保留“下载→完成→启动→确认协作”的必要顺序，简化片长时优先缩短等待段。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#131213 · #f4f5ed · #4d9d9a · #254b4a · #ffffff

## 元素与制作规则

下载按钮 / 进度条 / 本地拓扑 / 确认弹窗 / 云节点

- 安装进度完成后才能出现本地工具网络；云提升先经过确认。
- 云与本地纵向分层，虚线明确连接关系。

## 内容替换

- 换平台保留安装→运行→确认→协同的顺序。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V267",
  "palette": [
    "#131213",
    "#f4f5ed",
    "#4d9d9a",
    "#254b4a",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Portable Computer",
  "objects": [
    "下载按钮",
    "进度条",
    "本地拓扑",
    "确认弹窗",
    "云节点"
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
      "timeSeconds": 7.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 14.0,
      "frameId": "K0033",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 17.0,
      "frameId": "K0038",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 23.0,
      "frameId": "K0050",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 29.0,
      "frameId": "K0066",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "Windows 主张",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "下载组件",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "本地启动",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "工具拓扑",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "云升级主张",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "确认提示",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "本地设备",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "云节点",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "连线回本地",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 32.533333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 32.533333,
  "fontFamily": "Georgia, serif"
}
```
