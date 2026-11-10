"""Build the README's editable SVG diagrams with Python's standard library.

Run: python3 docs/readme/diagrams/generate.py
The cover paper is embedded so each diagram also works as a standalone image.
Content follows docs/product/architecture.md, docs/motion-md.md and the
resource responsibilities in library/ENTRY_TEMPLATE.md.
"""

from base64 import b64encode
from html import escape
import json
from pathlib import Path

OUT = Path(__file__).resolve().parent
INK = "#101820"
MUTED = "#34535A"


class Diagram:
    def __init__(self, title, description, height, locale, labels):
        self.locale = locale
        self.labels = labels
        title_text = self.translate(title)
        description_text = self.translate(description)
        paper = b64encode((OUT / "cover-paper.jpg").read_bytes()).decode("ascii")
        self.parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="{height}" viewBox="0 0 1200 {height}" role="img" aria-labelledby="title desc">
<title id="title">{escape(title_text)}</title><desc id="desc">{escape(description_text)}</desc>
<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="m1 1 5 3-5 3" fill="none" stroke="#34535A" stroke-width="1.4"/></marker></defs>
<image width="1200" height="{height}" preserveAspectRatio="none" xlink:href="data:image/jpeg;base64,{paper}"/>
<rect x="28" y="28" width="1144" height="{height-56}" rx="8" fill="#fffdf8" fill-opacity=".93"/>
<g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">''']
        self.text(600, 100, title, 42, bold=True)

    def translate(self, text):
        return self.labels[text] if self.locale else text

    def text(self, x, y, content, size=22, bold=False):
        self.parts.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{700 if bold else 400}" fill="{INK if bold else MUTED}">{escape(self.translate(content))}</text>')

    def line(self, path, arrow=False):
        marker = ' marker-end="url(#arrow)"' if arrow else ''
        self.parts.append(f'<path d="{path}" fill="none" stroke="{MUTED}" stroke-width="2"{marker}/>')

    def save(self, slug):
        (OUT / (f"{slug}.{self.locale}.svg" if self.locale else f"{slug}.svg")).write_text("\n".join(self.parts) + "\n</g></svg>\n", encoding="utf-8")


def creation_stack(locale, labels):
    d = Diagram("From a reference clip to an editable video", "Bring your local agent, your brand and optional media models. Break down the reference, write HTML scenes, generate missing media, edit in Studio and render the MP4.", 495, locale, labels)
    for x, name, detail in [(225, "Your local agent", "Skills and project tools"), (600, "Your media models", "Optional, with your keys"), (975, "Your brand", "Motion.md and assets")]:
        d.text(x, 170, name, 28, bold=True)
        d.text(x, 205, detail)
        d.line(f"M{x} 224 v28")
    d.line("M225 252 H975")
    d.line("M600 252 V285", arrow=True)
    for i, (step, detail) in enumerate([("Analyze", "Shots and beats"), ("Code", "Editable HTML"), ("Generate", "Missing media"), ("Edit", "Studio timeline"), ("Render", "Local MP4")]):
        x = 155 + i * 222
        d.text(x, 341, step, 31, bold=True)
        d.text(x, 379, detail, 21)
        if i < 4:
            d.line(f"M{x+72} 330 h70", arrow=True)
    d.text(600, 442, "Keep the video, its source and the assets you used.", 24)
    d.save("creation-stack")


def creative_context(locale, labels):
    d = Diagram("Inside Motion.md", "The Brand Kit, story, movement, sound and review notes give your agent the creative decisions to carry into the editable project.", 465, locale, labels)
    fields = [(188, "Brand Kit", "Logo, type, palette", "Voice and product facts"), (465, "Story", "Opening, shot order", "Reveal and closing beat"), (740, "Motion & sound", "Timing, transitions", "Music and voice cues"), (1010, "Review", "What to keep", "What you can change")]
    for x, name, first, second in fields:
        d.text(x, 179, name, 29, bold=True)
        d.text(x, 218, first, 20)
        d.text(x, 247, second, 20)
        d.line(f"M{x} 267 V292")
    d.line("M188 292 H1010")
    d.line("M600 292 V325", arrow=True)
    d.text(600, 371, "Give Motion.md and your assets to your agent.", 31, bold=True)
    d.text(600, 413, "Use the same creative decisions in a new cut.", 22)
    d.save("creative-context")


def runtime_architecture(locale, labels):
    d = Diagram("One project, from agent to render", "Your local agent uses MCP and Studio uses local HTTP. Both share the local application. The gateway supplies assets to the editable project and a fixed revision is rendered and verified.", 630, locale, labels)
    for x, name, detail in [(350, "Your local agent", "MCP · 9 project tools"), (850, "Studio", "Local HTTP")]:
        d.text(x, 173, name, 31, bold=True)
        d.text(x, 213, detail)
        d.line(f"M{x} 232 V257")
    d.line("M350 257 H850")
    d.line("M600 257 V285", arrow=True)
    d.text(600, 328, "Local application", 34, bold=True)
    d.text(600, 364, "Projects, media, versions and export jobs")
    d.line("M600 378 V404", arrow=True)
    for x, title, detail in [(231, "Model Gateway", "Your API keys"), (600, "Editable project", "HTML, CSS, JS and media"), (970, "Render and verify", "Fixed project revision")]:
        d.text(x, 453, title, 30, bold=True)
        d.text(x, 491, detail, 21)
    d.line("M360 446 H462", arrow=True)
    d.line("M735 446 H827", arrow=True)
    d.line("M970 507 V533 H600 V551", arrow=True)
    d.text(600, 590, "MP4 + editable source", 30, bold=True)
    d.save("runtime-architecture")


if __name__ == "__main__":
    translations = json.loads((OUT / "translations.json").read_text(encoding="utf-8"))
    for locale, labels in [(None, {}), *translations.items()]:
        creation_stack(locale, labels)
        creative_context(locale, labels)
        runtime_architecture(locale, labels)
