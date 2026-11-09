"""Build the README's editable SVG diagrams with Python's standard library.

Run: python3 docs/readme/diagrams/generate.py
No external fonts, images, scripts, renderers or dependencies are embedded.
Content follows docs/product/architecture.md, docs/motion-md.md and the
resource responsibilities in library/ENTRY_TEMPLATE.md.
"""

from html import escape
from pathlib import Path

OUT = Path(__file__).resolve().parent
INK = "#202F2C"
MUTED = "#526B65"
GREEN = "#087C62"
LINE = "#C9D9D1"
PAPER = "#FAFAF2"


class Diagram:
    def __init__(self, slug, title, description, height, number):
        self.slug = slug
        self.parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="{height}" viewBox="0 0 1280 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title)}</title>
<desc id="desc">{escape(description)}</desc>
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FAFAF2"/><stop offset="1" stop-color="#F0F7F3"/></linearGradient>
  <linearGradient id="water" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#087C62"/><stop offset="1" stop-color="#28B8B1"/></linearGradient>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 1 1 L 9 5 L 1 9" fill="none" stroke="#6A8F83" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker>
</defs>
<style>text {{ font-family: Arial, Helvetica, sans-serif; }} .mono {{ font-family: Menlo, Consolas, monospace; }}</style>
<rect width="1280" height="{height}" rx="24" fill="url(#paper)"/>
<path d="M1080 0 H1256 Q1280 0 1280 24 V180 C1170 170 1210 60 1080 0" fill="#DDEFE9"/>
<path d="M0 {height-85} C120 {height-130} 150 {height-5} 280 {height} H24 Q0 {height} 0 {height-24} Z" fill="#DDEFE9"/>
<rect x="48" y="36" width="30" height="5" rx="2.5" fill="url(#water)"/>
''']
        self.text(92, 45, "OPENMOTION", 17, GREEN, 700, spacing=2)
        self.text(1232, 45, f"{number:02d}", 18, MUTED, 600, anchor="end", mono=True)
        self.text(48, 103, title, 37, INK, 700)

    def text(self, x, y, value, size=20, color=INK, weight=400, anchor="start", mono=False, spacing=None):
        attrs = f' x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}"'
        if mono:
            attrs += ' class="mono"'
        if spacing is not None:
            attrs += f' letter-spacing="{spacing}"'
        self.parts.append(f'<text{attrs}>{escape(value)}</text>')

    def box(self, x, y, w, h, fill="#FFFFFF", stroke=LINE, radius=18):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>')

    def path(self, d, arrow=True, color="#6A8F83", dash=False):
        end = ' marker-end="url(#arrow)"' if arrow else ''
        dashed = ' stroke-dasharray="6 6"' if dash else ''
        self.parts.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"{end}{dashed}/>')

    def circle(self, cx, cy, r, fill):
        self.parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>')

    def save(self):
        (OUT / f"{self.slug}.svg").write_text("\n".join(self.parts) + "\n</svg>\n", encoding="utf-8")


def creation_stack():
    d = Diagram("creation-stack", "Your agent. The whole video stack.",
                "Bring your local agent, optional media-provider keys and creative resources. Understand the reference, code scenes, generate missing media, edit, and render MP4 with editable source.", 660, 1)
    d.text(48, 141, "Bring your brief, your brand and the tools you already use.", 22, MUTED)
    cards = [
        (48, "BYOA", "Your local agent", "Plans the story. Writes the code.", "Skills + MCP + supported CLI", "#E6F2EC"),
        (456, "BYOK", "Your media accounts", "Images · video · music · TTS", "Optional generation, your access", "#E5F1F8"),
        (864, "YOUR LIBRARY", "A creative head start", "Brandkit · Motion MD · templates", "References, components and Skills", "#FCF0E5"),
    ]
    for x, label, title, line1, line2, fill in cards:
        d.box(x, 184, 368, 168, fill)
        d.text(x+24, 218, label, 16, GREEN, 700, spacing=1.5)
        d.text(x+24, 258, title, 25, INK, 700)
        d.text(x+24, 294, line1, 18, MUTED)
        d.text(x+24, 324, line2, 18, MUTED)
        d.path(f"M{x+184} 352 V384", arrow=False)
    d.path("M152 384 H1048", arrow=False)
    d.path("M152 384 V411")
    steps = [("Understand", "Reference + intent"), ("Code", "HTML / CSS / JS"), ("Generate", "Missing media"), ("Edit", "Preview + refine"), ("Render", "Local export")]
    for i, (title, sub) in enumerate(steps):
        x = 48 + i*244
        d.box(x, 426, 208, 116, "#FFFFFF")
        d.circle(x+26, 452, 4, GREEN)
        d.text(x+44, 458, f"0{i+1}", 16, MUTED, 600, mono=True)
        d.text(x+20, 492, title, 24, INK, 700)
        d.text(x+20, 521, sub, 17, MUTED)
        if i < 4:
            d.path(f"M{x+214} 484 H{x+234}")
    d.path("M48 580 H1232", arrow=False, color=LINE)
    d.text(48, 622, "OPEN-SOURCE CREATION SOFTWARE", 16, GREEN, 700, spacing=1.2)
    d.text(1232, 622, "Your brand. Your source. Your MP4.", 23, INK, 600, anchor="end")
    d.save()


def creative_context():
    d = Diagram("creative-context", "Identity + motion, written down.",
                "BRANDKIT.md defines identity, message and approved material. MOTION_DESIGN.md defines story, movement, timing and review rules. SKILL.md guides the agent. Source, assets, presets and evidence make the creative package reusable. These files are explicit agent context, not automatic importers.", 846, 2)
    d.text(48, 141, "A creative system you can read, fork and give to your agent.", 22, MUTED)
    columns = [
        (48, "#FCF0E5", "YOUR IDENTITY", "Brandkit", "BRANDKIT.md", [
            ("Identity", "Logo · palette · typography"),
            ("Message", "Product facts · voice · approved claims"),
            ("Material", "Screenshots · footage · audio")]),
        (664, "#E6F2EC", "YOUR MOTION LANGUAGE", "Motion Design MD", "MOTION_DESIGN.md", [
            ("Story", "Hook · shot order · reveal · closing beat"),
            ("Movement", "Timing · easing · camera · sound cues"),
            ("Rules", "Keep / change decisions · review")]),
    ]
    for x, fill, eyebrow, title, filename, lines in columns:
        d.box(x, 184, 568, 276, fill)
        d.text(x+28, 219, eyebrow, 15, GREEN, 700, spacing=1.2)
        d.text(x+28, 259, title, 29, INK, 700)
        d.text(x+28, 290, filename, 18, MUTED, mono=True)
        for i, (label, content) in enumerate(lines):
            y = 338+i*43
            d.text(x+28, y, label, 18, GREEN, 700)
            d.text(x+145, y, content, 18, INK)
        d.path(f"M{x+284} 460 V490", arrow=False)
    d.path("M332 490 H948", arrow=False)
    d.path("M640 490 V517")
    d.box(48, 530, 1184, 104, GREEN, GREEN)
    d.text(76, 571, "SKILL.md", 24, "#FFFFFF", 700, mono=True)
    d.text(76, 605, "The method your agent follows", 19, "#DAEDE5")
    d.text(1204, 578, "Select inputs → adapt → preview → review", 23, "#FFFFFF", 500, anchor="end")
    d.path("M640 634 V652", arrow=False)
    d.path("M332 652 H948", arrow=False)
    d.path("M332 652 V669")
    d.path("M948 652 V669")
    d.box(48, 676, 568, 102)
    d.box(664, 676, 568, 102)
    d.text(76, 715, "SOURCE + ASSETS", 18, GREEN, 700, spacing=1)
    d.text(76, 750, "HTML / CSS / JS · media · editable project", 21)
    d.text(692, 715, "PRESETS + EVIDENCE", 18, GREEN, 700, spacing=1)
    d.text(692, 750, "Replacement inputs · previews · actual checks", 21)
    d.text(640, 820, "Explicit context for your agent. Reusable knowledge for the next creator.", 19, MUTED, anchor="middle")
    d.save()


def runtime_architecture():
    d = Diagram("runtime-architecture", "One project. Connected capabilities.",
                "Your local agent connects through nine MCP project tools, and Studio connects through local HTTP. The local application manages projects, media, revisions and exports. The Model Gateway generates assets with your accounts; adoption adds them to source. Rendering uses a fixed snapshot. Credentials remain outside video projects.", 940, 3)
    d.text(48, 141, "Local editing and rendering. Your agent and model accounts stay yours.", 22, MUTED)
    d.box(48, 184, 568, 122, "#E6F2EC")
    d.box(664, 184, 568, 122, "#E5F1F8")
    d.text(76, 224, "BYOA · YOUR LOCAL AGENT", 17, GREEN, 700, spacing=1)
    d.text(76, 270, "Creative direction + code + Skills", 24, INK, 600)
    d.text(692, 224, "OPENMOTION STUDIO", 17, GREEN, 700, spacing=1)
    d.text(692, 270, "Media + preview + editable timeline", 24, INK, 600)
    d.path("M332 306 V370")
    d.path("M948 306 V370")
    d.text(352, 345, "MCP · 9 project tools", 18, MUTED)
    d.text(968, 345, "Local HTTP", 18, MUTED)
    d.box(48, 386, 1184, 104, GREEN, GREEN)
    d.text(76, 429, "LOCAL APPLICATION", 21, "#FFFFFF", 700, spacing=1)
    d.text(76, 466, "Sessions · project files · assets · revisions · export jobs", 22, "#E1F0E9")
    d.text(1204, 445, "Node.js + TypeScript", 21, "#FFFFFF", 500, anchor="end")
    d.path("M640 490 V522", arrow=False)
    d.path("M232 522 H1048", arrow=False)
    for cx in [232, 640, 1048]:
        d.path(f"M{cx} 522 V551")
    for x, title, sub, lines, fill in [
        (48, "Model Gateway", "BYOK · YOUR ACCOUNTS", ["Image / video / music / TTS", "Provider adapters + jobs", "Keys outside the project"], "#E5F1F8"),
        (456, "Editable project", "THE SHARED SOURCE", ["HTML + CSS + JavaScript", "Media + Studio project data", "Preview, revise and keep"], "#FFFFFF"),
        (864, "Render + verify", "FIXED PROJECT SNAPSHOT", ["Chromium + frame capture", "FFmpeg / FFprobe", "Export checks + review"], "#FCF0E5"),
    ]:
        d.box(x, 568, 368, 190, fill)
        d.text(x+24, 602, sub, 15, GREEN, 700, spacing=.7)
        d.text(x+24, 644, title, 26, INK, 700)
        for i, line in enumerate(lines):
            d.text(x+24, 679+i*28, line, 19, MUTED)
    d.path("M420 665 H449")
    d.path("M828 665 H857")
    d.text(436, 793, "adopt media", 16, MUTED, anchor="middle")
    d.text(844, 793, "snapshot", 16, MUTED, anchor="middle")
    d.box(48, 826, 1184, 72, "#FFFFFF")
    d.text(76, 871, "DELIVERY", 17, GREEN, 700, spacing=1.2)
    d.text(1204, 872, "MP4 + editable source + media + export evidence", 24, INK, 600, anchor="end")
    d.path("M1048 758 V819")
    d.save()


if __name__ == "__main__":
    creation_stack()
    creative_context()
    runtime_architecture()
    print("Wrote 3 SVG diagrams")
