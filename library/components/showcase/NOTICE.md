# Source and modifications

Source: HeyGen Hyperframes, revision `070b964d7b8cd844a893f0abbe8e0b7f1ac6d879`, registry/blocks/{app-showcase,glass-shard-title,nyc-paris-flight,aurora}. Apache-2.0, with the included LICENSE and original asset notices.

OpenMotion renames the entry HTML to index.html, vendors its browser scripts/fonts, and changes their references to relative paths. Glass Shard's registry lists assets/matcap-1.png, which is absent from that pinned Git tree. OpenMotion supplies a new procedural SVG lighting texture, assets/matcap-1.svg, under Apache-2.0 and records this deviation instead of claiming exact source identity. Other source assets are unchanged.

Each vendor/ manifest records the dependency source, exact file hash and original license; these dependencies are not relicensed under Apache-2.0. Fonts and bundled shader/Three.js notices remain in assets/ or lib/. Reference films retain their original rights and are viewing examples, not a grant to reuse people, brands or voices.
