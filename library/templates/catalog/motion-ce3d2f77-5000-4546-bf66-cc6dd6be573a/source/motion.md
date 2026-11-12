# Composer · 分段歌曲编辑

把歌曲创作讲成可逐项控制的过程：先输入方向，再安排段落和歌词，调整速度与调性，最后进入试听与作品集合。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 59.1,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Composer",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#63d6b2"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Composer",
        "accent": "#63d6b2"
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

## 从开放请求进入具体控制

提示框先写创作意图，参考封面或素材随后进入。接着将 Verse、Chorus、Bridge 等段落拆成独立块，让歌词落到对应段落，而不是把整首歌堆成一段文字。

## 速度与调性各有固定位置

BPM 数字在同一个位置变化，调性在选择器中切换。调整参数时，其他控制保持稳定，让观众知道改变的是哪一项。

深青背景、青绿色重点与柔和流体形成音乐氛围；歌词用常规无衬线字体，段落标签与参数名略粗，数字保持对齐。

```motion-demo
{
  "id": "clip-2",
  "title": "速度与调性各有固定位置",
  "src": "demos/clip-2.html",
  "duration": 14,
  "status": "authored",
  "description": "18–32 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 波形负责播放，作品卡负责选择

结果出现后用播放线穿过波形表达试听进度，封面与名称保持可辨。多作品阶段将单卡展开成队列，保留同一组播放器元素。

波形可作为节奏图形，但需要真实音轨时应让播放线与声音同步；不要让装饰性的跳动掩盖歌词与参数。

## 换音乐方向时保留控制结构

替换创作提示、参考图、歌词与封面，重新选择速度和调性。可以改变背景材质和主色，保留输入、结构、参数、试听四种操作层级。

## 配色与字形

无衬线界面文字与清晰大小层级。

#071a1d · #f3fcf5 · #63d6b2 · #266f75 · #b4e1d8

## 元素与制作规则

提示条 / 参考封面 / 段落标签 / 歌词 / BPM数字 / 调性选择 / 波形 / 作品队列

- 从开放式请求进入可控制的段落、速度、调性，最后落到波形与作品
- 参数选择是因、输出变化是果，不能先输出再补输入
- 深青流体背景持续低频运动，工具卡片承担清晰阅读

## 内容替换

- 迁移到创作型工具时保留输入→结构→参数→成果链
- 波形是音频存在的视觉符号，需另附真实音轨才能验证音画关系

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "ElevenLabs",
  "id": "V059",
  "palette": [
    "#071a1d",
    "#f3fcf5",
    "#63d6b2",
    "#266f75",
    "#b4e1d8"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Composer",
  "objects": [
    "提示条",
    "参考封面",
    "段落标签",
    "歌词",
    "BPM数字",
    "调性选择",
    "波形",
    "作品队列"
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
      "timeSeconds": 7.0,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 13.0,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 27.0,
      "frameId": "K0096",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 38.0,
      "frameId": "K0130",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 57.0,
      "frameId": "K0184",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "品牌",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "歌曲请求",
      "end": 7.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.0,
      "label": "封面素材",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.0,
      "label": "上传参考",
      "end": 13.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.0,
      "label": "歌曲段落",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "歌词与副歌",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "节奏调节",
      "end": 27.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27.0,
      "label": "调性选择",
      "end": 32.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32.0,
      "label": "音频波形",
      "end": 38.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38.0,
      "label": "多作品展开",
      "end": 52.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 52.0,
      "label": "名称",
      "end": 57.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 57.0,
      "label": "品牌",
      "end": 59.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 59.1,
  "fontFamily": "Arial, sans-serif"
}
```
