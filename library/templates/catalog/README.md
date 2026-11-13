# Motion template catalog

Browse imported motion guidance and original community examples. Guides, HTML examples and small images are here. Images over 100 KB load from existing public CMS links. Imported reference videos and original ZIP downloads stay at their existing CMS URLs. New contribution media can use Git LFS without a CMS account; see [media contribution and download instructions](../../../docs/template-repository.md#contribute-media-without-cms-access).

## Try one template

Open [the first template's guide](motion-f4b325fd-64ba-42da-9f7e-6a6b77cfafd2/source/preview.html) in a browser and play its authored examples. No build step is needed. Templates with large reference images need an internet connection to load their CMS renditions; small images stay local. Read its [motion.md](motion-f4b325fd-64ba-42da-9f7e-6a6b77cfafd2/source/motion.md) for the motion specification; `TEMPLATE.md` links the separate reference video.

These are **reference guidance with authored HTML examples**, not verified complete Studio projects. Their existing `pending` status and empty project-file manifests are preserved. The three editable Studio examples remain in `template-library/`.

For an original contribution example, open [Orbit Launch](motion-orbit-launch/TEMPLATE.md): a six-second launch-title recipe with offline HTML playback, motion rules, a small local poster and a separately stored preview video. Its metadata includes all eleven locale slots; the motion guide and example use English.

## Change a template

Each stable ID has one directory:

```text
template.json       Shared metadata, locale overrides and original CMS archive identity and remote assets
TEMPLATE.md         Usage, status and acknowledgements
source/             Markdown, HTML, CSS, JavaScript, measurements and small local images
  manifest.json     Local/remote original paths, sizes, hashes and provenance
  assets/           Images used by the guide and examples
```

Edit files directly. After source changes, refresh the manifest, then stage and check:

```sh
npm run templates:manifest -- <template-id>
git add library/templates/catalog
npm run templates:check -- <full-base-commit-sha>
node --test tests/template-library.test.ts
```

The checker reads staged contents. The base SHA also enables checks of new Git history: deleting a mistakenly committed large file or video in a later commit does not remove it from history. New entries need a stable ID registered in `catalog.json`, all locale slots, required guide files and actual source/rights notes in `TEMPLATE.md`.

| Files | Storage and limit |
| --- | --- |
| Code, documentation and measurements | Ordinary Git, at most 1 MiB per file |
| Small images/fonts | Ordinary Git under `source/assets/`, at most 100 KB (100,000 bytes) per asset |
| Images/fonts over 100 KB | Git LFS under `source/assets/lfs/`; existing imported CMS links retain their recorded identities |
| Complete catalog in ordinary Git | At most 128 MiB; about 58 MB after reference-image optimization |
| Video and audio | Git LFS under `source/assets/lfs/`; existing imported references retain CMS links |
| LFS media budgets | At most 50 MiB per file and 150 MiB total local media per template |
| Original ZIP downloads | Existing links only; archives are not contribution source |
| Exports, dependencies and generated output | Outside catalog source; use ignored `.artifacts/` for local output |

The import keeps 1,419 small reference images locally, optimized from 65.2 MB of JPEGs to WebP at their original dimensions. Local guides and manifest hashes use the optimized files; each template records the encoding in its provenance. Original JPGs remain in the unchanged published packages. Another 236 larger originals (32.5 MB) use existing CMS WebP renditions, which total 12.6 MB and load when viewing affected guides. New LFS media needs Git LFS and a scoped pull before preview; contributors do not need a CMS account. See [the download and contribution steps](../../../docs/template-repository.md#contribute-media-without-cms-access).

Submit PRs against `main`. CI runs **Template library policy** without CMS publishing credentials or media downloads. Repository branch protection must separately require the job to prevent merging a failed check.

## Publishing boundary

Source Studio and MCP load this directory directly. See [local startup and plugin paths](../../../docs/template-repository.md#run-from-a-local-clone). The website and installed applications without the repository catalog continue to consume CMS publications. A merged source change does not publish CMS content. To export metadata for review:

```sh
npm run templates:export -- .artifacts/catalog-candidate.json
```

This writes a CMS-compatible file, including all locale overrides and collection facets. It does not upload or publish. The imported publication identity is retained for comparison and must not be reused for changed content. After editing source, package and upload it through the existing CMS workflow, update `sourceArchive` and affected download URLs, and publish a new content revision. Existing translated downloads do not silently change with local source edits.

See [the contribution and publication workflow](../../../docs/template-repository.md). The catalog and developer tools are excluded from application/npm packages.

## Catalog

| Template | Brand | Source ID |
| --- | --- | --- |
| [Figma — Figma Motion](motion-e6ac921a-f56f-4170-a2be-938cec5d028b/TEMPLATE.md) | Figma | V100 |
| [Notion — Custom Agents](motion-c74e1725-6fd2-4885-be7f-f1f705e9af66/TEMPLATE.md) | Notion | V085 |
| [A product launch connected by blue light](motion-5805e419-651f-45b7-90be-302c93f79b21/TEMPLATE.md) | Framer | V301 |
| [Aesthetic design partner](motion-46f34492-8ba1-4ba5-ac6e-4b4a13c80373/TEMPLATE.md) | Lovable | V039 |
| [IBM — watsonx](motion-d151cc2c-40bc-4765-a767-3957bdee6ec2/TEMPLATE.md) | IBM | V369 |
| [Enterprise agent workflows](motion-f6f244d1-c549-4081-8a5d-f0e1e3660044/TEMPLATE.md) | Glean | V379 |
| [Linear — Orbit](motion-3b955ba8-2f6f-47ef-910c-79115843bd6b/TEMPLATE.md) | Linear | V111 |
| [Xiaomi — HyperOS](motion-d8eea6d9-b25b-4727-823d-d102070ea694/TEMPLATE.md) | Xiaomi | V227 |
| [Figma — Draw inspiration](motion-dfb1a35a-a70e-489f-8e02-b74068fc0b8c/TEMPLATE.md) | Figma | V099 |
| [An information field focuses into research](motion-2d4e10c0-c178-4f7c-a365-e51b5e30b455/TEMPLATE.md) | Harvey | V336 |
| [Prompt-to-website launch](motion-8605acf7-c0e9-465b-858a-114c49764c3d/TEMPLATE.md) | Bolt | V372 |
| [Collaboration across devices](motion-1e48dea5-903d-48f6-b10e-99a70f1c183d/TEMPLATE.md) | Lark | V366 |
| [Material-shifting model mark](motion-38b9c70f-cf58-4555-a50e-30c17479ba1e/TEMPLATE.md) | Alibaba | V174 |
| [Butterfly — Pond](motion-a653c6bb-3e85-420c-8b4a-3353b8fd8fbf/TEMPLATE.md) | Butterfly | V375 |
| [Linear — At your command](motion-b3e82855-5bf8-48c5-8153-fd43d09b30ed/TEMPLATE.md) | Linear | V240 |
| [Cyera — Secure the unknown](motion-f9bf74bb-fb65-4430-97b9-71ae5d7b3397/TEMPLATE.md) | Cyera | V377 |
| [Layered interface journey](motion-b31d078a-4e5e-461e-8b43-3101ee0a2f93/TEMPLATE.md) | Webflow | V352 |
| [Connected customer worlds](motion-9c62b31c-d5e8-4027-8057-e8f1c3949f6c/TEMPLATE.md) | Twilio | V395 |
| [Several creative formats in one editor](motion-b4a2bd67-b577-4e6a-8475-966edd41d474/TEMPLATE.md) | Canva | V146 |
| [Extruded manifesto loop](motion-5ec91ccc-4243-445b-8bf3-d7d85e65a309/TEMPLATE.md) | Comfy | V364 |
| [Radial identity burst](motion-343ccb64-5c8e-4101-b65e-463aec3a7c35/TEMPLATE.md) | GitHub | V348 |
| [Cashback offer mechanics](motion-a6f31f7b-f6af-44be-8bf4-881e70057f63/TEMPLATE.md) | Higgsfield | V322 |
| [Figma — Q2 Highlights](motion-6b58e785-aace-4d84-9229-7d68d6ed247b/TEMPLATE.md) | Figma | V102 |
| [Cash App — Make Money Moves](motion-d4e8028e-fa9e-439f-8072-690f9b36845b/TEMPLATE.md) | Cash App | V359 |
| [Domain dot transformations](motion-b8332d8d-385e-4199-b6f3-e0cc340bc41f/TEMPLATE.md) | Identity Digital | V381 |
| [Zapier — OFF → ON](motion-e0faf135-a425-4c7a-a795-2d5c59b90ab3/TEMPLATE.md) | Zapier | V392 |
| [Creative Cloud](motion-e62d4e85-ccf4-4e3e-8388-ae70143cb3dc/TEMPLATE.md) | Adobe | V343 |
| [Kinetic manifesto 15s](motion-cfd6f6b6-2f3f-4e53-957d-1e87cfebe777/TEMPLATE.md) | TIDAL | V390 |
| [A paper geometry system for knowledge work](motion-4cab572a-4d2a-4058-8a06-84cf3fda0df0/TEMPLATE.md) | Harvey | V149 |
| [Ink becomes networks and knowledge](motion-0c10d4de-a147-4a1b-8938-4c2d4a94a207/TEMPLATE.md) | Kimi | V033 |
| [Wonderful — $550M](motion-7b279560-81df-4c31-988d-473d35536c28/TEMPLATE.md) | Wonderful | V391 |
| [Focusable planet carousel](motion-fbb00c6a-6153-4a88-b8fe-fc15ad81d15b/TEMPLATE.md) | Perplexity | V077 |
| [Sound-wave heart](motion-24e46588-504b-4efd-ac28-6ffc407fc33a/TEMPLATE.md) | Deezer | V396 |
| [A world connected by computational fragments](motion-a3fec53a-a603-4486-9ec0-f7a6f926ab8d/TEMPLATE.md) | Kimi | V032 |
| [A frontier horizon](motion-a1c471ae-a235-40ba-b24e-9a502a00cb33/TEMPLATE.md) | OpenAI | V327 |
| [From constrained to open creation](motion-e3ad4095-8f2e-4c03-b834-d2525b73e257/TEMPLATE.md) | Webflow | V353 |
| [Cloudera — Your journey to enterprise AI](motion-c6e0520b-c6a6-47c6-9905-23ba6d04cc86/TEMPLATE.md) | Cloudera | V376 |
| [Five components in one viewport](motion-2208d0c1-6565-4b69-89cb-581e7206ac12/TEMPLATE.md) | Framer | V339 |
| [An evolving web network](motion-3ac3bd45-8732-4ce3-8331-ca6e96e2aed2/TEMPLATE.md) | Parallel Web Systems | V199 |
| [A flight through sun and moon](motion-3237a979-1718-4b54-9581-4cd639377cd8/TEMPLATE.md) | OpenAI | V010 |
| [Figma — Q1 2026](motion-f4b325fd-64ba-42da-9f7e-6a6b77cfafd2/TEMPLATE.md) | Figma | V101 |
| [Figma — Make-a-thon](motion-f878182e-c863-45eb-ac54-2e472890987b/TEMPLATE.md) | Figma | V103 |
| [Figma — Bring code to the canvas](motion-c9623fa3-6ecd-4045-9c6e-7ad574562563/TEMPLATE.md) | Figma | V276 |
| [Figma — Agents on the canvas](motion-80640920-4ab0-4ac0-b66e-3b64726e7960/TEMPLATE.md) | Figma | V248 |
| [Figma — CONFIG](motion-d9465c0d-9d09-43d3-a1e7-c5617022db9d/TEMPLATE.md) | Figma | V104 |
| [Figma — Roundtrip between code and canvas](motion-b35abe81-509c-424a-9acf-347a8831b857/TEMPLATE.md) | Figma | V105 |
| [Figma — MAKEATHON](motion-92cf4fa2-b65b-4ca2-a6ac-40d4bed47bdd/TEMPLATE.md) | Figma | V106 |
| [Figma — Connect Google Drive](motion-a09000a0-dc1b-47a8-a807-1ede9667e144/TEMPLATE.md) | Figma | V107 |
| [Figma — Figma in Weave](motion-4d2c0503-a324-49e7-924d-0eae443f54d7/TEMPLATE.md) | Figma | V270 |
| [Figma — Design to implementation](motion-ccb4e364-1666-4672-80d4-cb68fb591bad/TEMPLATE.md) | Figma | V273 |
| [Figma — Specs](motion-e558c471-28db-4353-a1c8-9ce5089838b1/TEMPLATE.md) | Figma | V277 |
| [Figma — Generate, edit, animate](motion-c2ff6df1-76b3-4045-878b-bc91f1962464/TEMPLATE.md) | Figma | V282 |
| [Figma — Image editing](motion-d214ebc1-b1cd-4615-8d40-d580632e8f29/TEMPLATE.md) | Figma | V285 |
| [Linear — Loops](motion-b852576e-fa72-453e-aae4-209a7a24a42d/TEMPLATE.md) | Linear | V109 |
| [Linear — Product development system](motion-ea3e966c-24ae-4313-b870-cd6a464935ca/TEMPLATE.md) | Linear | V244 |
| [Linear — Loops](motion-27b3a44f-5c17-4bea-83f0-5e92e0ad20d9/TEMPLATE.md) | Linear | V110 |
| [Linear — Custom environments](motion-81c409d2-46e9-4c90-bcde-a0de2106f81e/TEMPLATE.md) | Linear | V112 |
| [Linear — Engineering meeting prep](motion-b8ec3aa1-bed2-43d9-894f-e081667dcc1c/TEMPLATE.md) | Linear | V113 |
| [Linear — Queued](motion-b9ac4d16-55e8-4498-81e8-7fb4c264119d/TEMPLATE.md) | Linear | V114 |
| [Linear — Experience the diff](motion-3957ff01-8fd8-4a30-b8ac-b88705c90dbc/TEMPLATE.md) | Linear | V249 |
| [Linear — Coding sessions on mobile](motion-5f387971-3508-4a22-9c5a-63c05cbdb37f/TEMPLATE.md) | Linear | V255 |
| [Collaborative chat building](motion-d96e83db-9460-4d75-8e13-0a899f647087/TEMPLATE.md) | Lovable | V041 |
| [Connector-to-app cases](motion-bc7b69f5-1816-4961-9501-754feba2e5b2/TEMPLATE.md) | Lovable | V299 |
| [Question-to-proof reveal](motion-228c2d11-8827-416f-9f9f-aacf002cb7e0/TEMPLATE.md) | Lovable | V042 |
| [Import source carousel](motion-85d291f5-d569-4b9e-8143-0df9e7783fd0/TEMPLATE.md) | Lovable | V043 |
| [Orbiting brand shapes](motion-be2a4af0-0183-4979-ab05-2a68413c0890/TEMPLATE.md) | Lovable | V044 |
| [Notion — Your agents. Now doing more.](motion-a325ecf0-23a5-4f4b-a888-c5a8f4517126/TEMPLATE.md) | Notion | V084 |
| [Notion — External Agents](motion-bb9fab32-b108-42a9-bb6d-f391b8d9f286/TEMPLATE.md) | Notion | V087 |
| [Notion — Turn your best work into a skill](motion-fb18104a-3399-4531-adf1-88e48414c7dc/TEMPLATE.md) | Notion | V307 |
| [Notion — Edit skills together](motion-c14908dc-a53c-4f6b-a97d-a4904219902d/TEMPLATE.md) | Notion | V088 |
| [Notion — Notion Skills](motion-ae1ab93e-e10e-4cad-a2c4-23a397345ad5/TEMPLATE.md) | Notion | V089 |
| [Notion — Company Home](motion-1301d172-4b2d-44c8-95e6-872c82987796/TEMPLATE.md) | Notion | V090 |
| [Notion — Any tool. Any agent.](motion-e56bae66-988c-438c-b258-adfbe1e52857/TEMPLATE.md) | Notion | V091 |
| [Notion — Notion as code](motion-56ab9744-78aa-4841-bdb1-697c2df915e0/TEMPLATE.md) | Notion | V303 |
| [Business growth milestones](motion-730d0690-8a79-483e-aa72-28452f10dcca/TEMPLATE.md) | Higgsfield | V051 |
| [Motion design workspace](motion-90713ad1-ac50-4d2d-ba9e-ddf718959fe2/TEMPLATE.md) | Higgsfield | V052 |
| [Creative plugin workflow](motion-b18272fd-07c8-4ab9-b7dc-26311fa5a29a/TEMPLATE.md) | Higgsfield | V305 |
| [Multi-model API network](motion-0c91857e-f630-4d75-85ab-1feec5566c46/TEMPLATE.md) | Higgsfield | V319 |
| [Mathematics as evolving geometry](motion-10adc0e0-3f63-45c9-9389-2657360c8aa0/TEMPLATE.md) | OpenAI | V011 |
| [Legal work across connected tools](motion-a01301cc-7413-48d0-90ff-bbb173acc167/TEMPLATE.md) | OpenAI | V320 |
| [Demand becomes a desktop release](motion-98e8aea3-0e9a-45f2-9ff8-d8a323204378/TEMPLATE.md) | OpenAI | V012 |
| [Review before sending](motion-b39e4df1-4bdb-4c7b-8b33-803f53238bb5/TEMPLATE.md) | OpenAI | V009 |
| [A cast of voices](motion-16e994b2-cdba-45e1-b328-2af68af74985/TEMPLATE.md) | OpenAI | V014 |
| [Many possible futures](motion-6a60a781-d223-4c03-96ba-88bcaafd62d3/TEMPLATE.md) | OpenAI | V015 |
| [Code becomes a shared document](motion-c7d359a2-443b-4ee8-9f6a-f9c65d780f6d/TEMPLATE.md) | OpenAI | V304 |
| [Animated media and iterative editing](motion-7427c442-35ee-408f-9c33-4280ad2d3465/TEMPLATE.md) | OpenAI | V326 |
| [Slide creation and variety](motion-4f6f4723-0010-4efd-b13d-d2dabf899e88/TEMPLATE.md) | Manus | V231 |
| [Reusable skill library](motion-6169c2d0-a372-445e-96a3-e5eb43b00656/TEMPLATE.md) | Manus | V233 |
| [Conversation branching](motion-c70c9db2-6726-4aa0-81a2-bcef85c19402/TEMPLATE.md) | Manus | V234 |
| [Wide parallel research](motion-b9484abe-d87d-4dec-b823-98e9a748c9d4/TEMPLATE.md) | Manus | V232 |
| [Trigger and action](motion-1aaf35f0-86c4-4c56-be32-7951f4bfc797/TEMPLATE.md) | Manus | V046 |
| [Website-to-desktop app](motion-48a070b4-f3ee-49bb-8f18-fd071b73dc91/TEMPLATE.md) | Manus | V045 |
| [Chat-to-generated result](motion-60243f44-70ea-4715-b987-e10ee543887c/TEMPLATE.md) | Manus | V047 |
| [Cloud computer workflow](motion-eb5e7505-5597-469a-81d0-af00335f029f/TEMPLATE.md) | Manus | V048 |
| [Recurring task calendar](motion-4c3e677d-279f-4a5b-b7b4-f94e1b79a722/TEMPLATE.md) | Manus | V049 |
| [Foldable device continuity](motion-f11e199c-f90b-4df1-be9c-33734ad80c26/TEMPLATE.md) | Manus | V050 |
| [Scan to Suggested Fix](motion-4ac56dc1-dd84-452a-9d74-7388e49b7dbd/TEMPLATE.md) | Anthropic | V237 |
| [Triptych on an Arc](motion-feeeda96-c525-4c1c-889b-98774759ecfc/TEMPLATE.md) | Anthropic | V003 |
| [Installing the product name](motion-0e3488b3-db0b-4058-b70e-b58ac6213105/TEMPLATE.md) | Anthropic | V253 |
| [A workspace for multiple coding sessions](motion-cbb18ecc-34d6-43f2-bcd9-5d287ff82b83/TEMPLATE.md) | Anthropic | V242 |
| [Conversational Design Workflow](motion-9f3b5395-c61e-45aa-97db-f164e762e61a/TEMPLATE.md) | Anthropic | V002 |
| [Making-of Window Collage](motion-f51cf753-f530-43cd-afa5-0f178e7811b9/TEMPLATE.md) | Anthropic | V004 |
| [Multi-material Numeral](motion-d75c22e1-3c2c-4df8-aece-d4f7a37d8ff0/TEMPLATE.md) | Anthropic | V005 |
| [Macro Match-cut Rhythm](motion-36c45042-6bae-4e0f-8365-7b43212eeeef/TEMPLATE.md) | Anthropic | V006 |
| [Proactive Assistant Conversation](motion-14b59d59-5295-4014-9bf6-9103025baa0b/TEMPLATE.md) | Anthropic | V007 |
| [Voice Circle Reveal](motion-dac924da-010f-4445-baf3-a39cb033e48f/TEMPLATE.md) | Anthropic | V008 |
| [Phone to Desktop Handoff](motion-5d05235e-aa1b-4c06-ad97-3ea6c41962a2/TEMPLATE.md) | Anthropic | V238 |
| [Connected Tools Evidence Chain](motion-74f06cd2-601f-434d-a616-62da95828cb5/TEMPLATE.md) | Anthropic | V241 |
| [Gather scattered agents](motion-89f2191f-bd58-48e2-a1f5-41c0cc759b59/TEMPLATE.md) | Anthropic | V245 |
| [One topic across documents and designs](motion-55c19bf3-dbb1-4890-98c7-5ea7fb5ee432/TEMPLATE.md) | Anthropic | V268 |
| [From a wish to a budget](motion-58611416-78a3-444d-9c15-181c7c36adf8/TEMPLATE.md) | Anthropic | V283 |
| [Search across people, places and things](motion-1da97ff4-695c-404a-8c47-c0a0ab2921aa/TEMPLATE.md) | Google | V016 |
| [Three features arrive](motion-60b66835-4999-48ad-b942-4872ea012b85/TEMPLATE.md) | Google | V265 |
| [Mail tasks become actions](motion-94fdb751-f3cf-4c08-906b-2bcf5dd73ecd/TEMPLATE.md) | Google | V235 |
| [A new identity assembled from particles](motion-d2c98a37-41c1-411a-a21f-fc50219b3a7a/TEMPLATE.md) | Google | V018 |
| [A search box for fuller intent](motion-4136af75-145b-41f1-97d3-06ded1f58f2e/TEMPLATE.md) | Google | V017 |
| [An editable photo-mosaic numeral](motion-030d40f1-a081-451c-b557-a0bea9703616/TEMPLATE.md) | Google | V019 |
| [Search categories in a point cloud](motion-4f330399-939d-4dba-8525-fff2f84602cd/TEMPLATE.md) | Google | V020 |
| [Salsa through instruments and dance](motion-5eb6929e-d9f3-4a49-a69e-0363e45884dc/TEMPLATE.md) | Google | V021 |
| [Search for available services](motion-ae26dbdd-1cb7-434e-9b50-b7c9116ab46c/TEMPLATE.md) | Google | V281 |
| [A growing stack of characters](motion-dfbe2224-d097-4f35-ac18-edd61ad7a065/TEMPLATE.md) | xAI / Grok | V309 |
| [A prize motivates participation](motion-96f14740-8874-4048-9ba8-5abb19c7c072/TEMPLATE.md) | xAI / Grok | V024 |
| [A configured assistant becomes a template](motion-89fae9c1-f9fa-4d67-a213-940bcd029782/TEMPLATE.md) | xAI / Grok | V312 |
| [A partnership on flowing color](motion-f79b250a-1eb7-4a38-be7e-fe955376e08e/TEMPLATE.md) | xAI / Grok | V311 |
| [Sources become a summary](motion-b78b15b0-a413-459f-b2f2-dc7b2fa3f688/TEMPLATE.md) | xAI / Grok | V023 |
| [User input resumes an agent task](motion-94ac058e-ba55-4cc7-b8fd-64cb6dabc909/TEMPLATE.md) | xAI / Grok | V025 |
| [A voice announcement over moving color](motion-c8f1a735-2a04-44c0-b2bb-fa40bbcbbf09/TEMPLATE.md) | xAI / Grok | V026 |
| [Speech leads to an artifact](motion-d9104b0c-a3cb-4745-9a7e-33230c129e9b/TEMPLATE.md) | xAI / Grok | V027 |
| [A briefing becomes a voice note](motion-d558f0d8-3749-4726-84ee-63b94b1538fe/TEMPLATE.md) | xAI / Grok | V028 |
| [A character presents a payment card](motion-134b4303-daa6-4e6b-9027-3287dffb1ce1/TEMPLATE.md) | xAI / Grok | V313 |
| [A request and answer on the lock screen](motion-6deb74b6-8f52-4b81-b971-3b68e1fffa34/TEMPLATE.md) | xAI / Grok | V314 |
| [A financial partnership identity](motion-bfef85b7-cef0-45ce-a596-e8dd653c8bd7/TEMPLATE.md) | xAI / Grok | V315 |
| [A partnership in deep blue](motion-1f10a9ab-e989-4aec-80bd-4afe15280424/TEMPLATE.md) | xAI / Grok | V316 |
| [Project memory across sessions](motion-e5959798-9c70-4f6e-b16b-4375a87adfc2/TEMPLATE.md) | xAI / Grok | V318 |
| [From prompt to a published app](motion-3016ace9-aa52-4cc7-acc3-042e2a81088c/TEMPLATE.md) | xAI / Grok | V328 |
| [One task across phone and desktop](motion-3845bb3e-dafb-4af2-9507-d32400b5aa54/TEMPLATE.md) | Kimi | V029 |
| [Browser actions beside agent feedback](motion-60f0411c-316e-4b1c-8c15-c1c56527e53a/TEMPLATE.md) | Kimi | V246 |
| [Prompt-to-result capability reel](motion-7b4b6492-416e-4c84-8be0-5dcade56adb6/TEMPLATE.md) | Mistral | V230 |
| [Code is tested by a visible simulation](motion-82aab926-a9a1-4f08-835f-4e9089877ef9/TEMPLATE.md) | Mistral | V036 |
| [A release told in product chapters](motion-db8581fb-3dc8-426e-8cc4-fd60debb5ced/TEMPLATE.md) | Mistral | V035 |
| [Four-app parallel showcase](motion-652fa397-9dcc-441d-80cb-3a806d132e96/TEMPLATE.md) | Emergent | V058 |
| [Generated budget app walkthrough](motion-6a90052f-c0f7-4a05-9a21-0a84a341af46/TEMPLATE.md) | Emergent | V057 |
| [Mobile building launch](motion-ffaef2b8-7833-4612-ba45-0efd992cc43a/TEMPLATE.md) | Emergent | V056 |
| [Missed call to assistant response](motion-6100365a-945f-43b4-b476-7e8d30e2db32/TEMPLATE.md) | ElevenLabs | V060 |
| [Structured transcription features](motion-d86700fa-19e5-4f8c-900a-a03429cc89b4/TEMPLATE.md) | ElevenLabs | V295 |
| [Controllable song composition](motion-ce3d2f77-5000-4546-bf66-cc6dd6be573a/TEMPLATE.md) | ElevenLabs | V059 |
| [Music library and creation](motion-fb72e5e5-872c-4981-b137-4533a72567fe/TEMPLATE.md) | ElevenLabs | V064 |
| [Funding and product suite](motion-87a0c9d5-89f0-49f8-8faf-343a44f2beb7/TEMPLATE.md) | ElevenLabs | V296 |
| [Prompt-to-media workflow](motion-c1de8de0-4333-46d2-be29-3e4090856170/TEMPLATE.md) | ElevenLabs | V300 |
| [Competition and rewards](motion-0220cd62-09db-43d7-87f7-494ec9ee0441/TEMPLATE.md) | Polymarket | V333 |
| [Regional odds exploration](motion-797418c0-9781-4a86-a8fd-b3cbcb86037e/TEMPLATE.md) | Polymarket | V069 |
| [Perpetual order workflow](motion-b09ce21c-bdd4-4bf7-8d22-bb19fd40e5ab/TEMPLATE.md) | Polymarket | V066 |
| [Binary market interaction](motion-7023f16a-1973-40da-9348-4e157ea5239e/TEMPLATE.md) | Polymarket | V067 |
| [Compressed countdown flow](motion-9515f460-834f-4835-a512-f53890e27cb7/TEMPLATE.md) | Polymarket | V068 |
| [Agent-controlled simulator](motion-e2b86338-8508-40c5-ba89-084eca9e0f25/TEMPLATE.md) | Cursor | V071 |
| [Repository lifecycle](motion-927b643f-10c5-4c96-b2fe-f06bed85c9b8/TEMPLATE.md) | Cursor | V258 |
| [Code-driven agent operations](motion-2c28ef03-af00-440b-83d8-543b7c1e6fbb/TEMPLATE.md) | Cursor | V070 |
| [Concurrent task conversation](motion-927a222e-3fcd-4565-aa63-40e97447688a/TEMPLATE.md) | Cursor | V073 |
| [Annotated visual editing](motion-f7b30612-b414-4a92-bd26-9f03ec1575df/TEMPLATE.md) | Cursor | V072 |
| [SDK code and terminal](motion-63434ede-a918-4ec1-a99e-ba12e87d4063/TEMPLATE.md) | Cursor | V074 |
| [Recursive agent orchestration](motion-8197b521-9883-45de-be9d-6b492770b3eb/TEMPLATE.md) | Cursor | V075 |
| [Design-system component creation](motion-76a44f60-a882-4226-9976-4dbb9f105f2c/TEMPLATE.md) | Cursor | V239 |
| [Tablet creation and review](motion-0b5f0027-4637-4ba8-8eff-ee14ffb095a4/TEMPLATE.md) | Cursor | V254 |
| [Performance and recovery comparison](motion-89e97c54-0d34-4d6d-9775-133b7a0ae0fc/TEMPLATE.md) | Cursor | V257 |
| [Agent feature update cadence](motion-e637f1df-8aa8-4594-970c-7dfa666ef8f5/TEMPLATE.md) | Cursor | V260 |
| [Prompt, preview and publish](motion-c77ccf22-57cc-4afb-b398-aab0bb7617d3/TEMPLATE.md) | Cursor | V262 |
| [Phone-to-desktop agent sync](motion-4946d023-cd88-41c1-9178-5742e92d2427/TEMPLATE.md) | Cursor | V274 |
| [Live app publishing](motion-a55bd50a-ab7b-4f47-9cff-8b6faddfadf7/TEMPLATE.md) | Cursor | V284 |
| [Perplexity — Explore your answers visually](motion-2b0dd9d6-eea1-46a7-9c02-bcbef4782e18/TEMPLATE.md) | Perplexity | V080 |
| [Perplexity — Automate anything](motion-aa9742de-5366-4283-953d-e692a2fbce12/TEMPLATE.md) | Perplexity | V079 |
| [Perplexity — Projects in Computer](motion-d17c7cfb-5ccf-4c2d-be92-e485a181671d/TEMPLATE.md) | Perplexity | V256 |
| [Perplexity — Comet](motion-71db3b43-bf59-43a1-b8ad-85354a44e78b/TEMPLATE.md) | Perplexity | V078 |
| [Perplexity — Run tasks locally](motion-faceb915-f2c3-4dac-972b-a146d31eef72/TEMPLATE.md) | Perplexity | V081 |
| [Perplexity — Model Council](motion-b99bb97e-c533-4f2c-9921-48fff629d80d/TEMPLATE.md) | Perplexity | V082 |
| [Perplexity — Computer](motion-3b8aa76b-7235-4cc1-b2f9-3e9bded13c27/TEMPLATE.md) | Perplexity | V083 |
| [Perplexity — Your data has answers](motion-7191c712-7794-4f62-bd5d-203293cb8f0c/TEMPLATE.md) | Perplexity | V247 |
| [Perplexity — Deep Research](motion-5bca88f2-2a31-43ec-bf86-e43d30f93217/TEMPLATE.md) | Perplexity | V251 |
| [Perplexity — Computer for Counsel](motion-addf1d49-2044-4959-b4e1-8e627ea00226/TEMPLATE.md) | Perplexity | V252 |
| [Perplexity — Computer works wherever you do](motion-03a1f5ca-617b-41a6-b4cb-6307ca32ff63/TEMPLATE.md) | Perplexity | V259 |
| [Perplexity — Portable Computer](motion-5f7ad673-4895-4464-86d2-d08d875281b6/TEMPLATE.md) | Perplexity | V261 |
| [Perplexity — Introducing hybrid](motion-85c4648e-b5d8-4e57-93d2-b8feb1c5d48d/TEMPLATE.md) | Perplexity | V263 |
| [Perplexity — Portable Computer](motion-74842385-a951-4617-aa23-67d4cbf57f22/TEMPLATE.md) | Perplexity | V267 |
| [Perplexity — Effort controls](motion-60433399-faf4-4bbf-b860-19584b012213/TEMPLATE.md) | Perplexity | V269 |
| [Apple — Send a message](motion-2cd7fd99-8dff-4c2c-8577-719c51ae9e5c/TEMPLATE.md) | Apple | V287 |
| [Apple — Across devices](motion-dc52ebb8-adb7-442a-b57b-8e647e68863f/TEMPLATE.md) | Apple | V289 |
| [From prompt to bulk CMS updates](motion-0fd96b86-9f36-4bdd-9dcb-d249e43ab164/TEMPLATE.md) | Framer | V152 |
| [Two glowing windows](motion-4fdfd64a-8fb2-43ee-96f6-7755f8b7b11e/TEMPLATE.md) | Framer | V153 |
| [Teach the agent a reusable style](motion-d4b9bf2f-fae1-4311-b063-ca942de2254a/TEMPLATE.md) | Framer | V272 |
| [A focused template carousel](motion-ab741f6c-6d55-4fac-9862-0a0914806c2b/TEMPLATE.md) | Framer | V280 |
| [A sentence drawn by glass light](motion-dbb8ef9c-613d-4725-9328-a0c3700baa9e/TEMPLATE.md) | Framer | V338 |
| [An agent payment with human approval](motion-80dceb1d-5219-4e1f-9394-6baacf5d0166/TEMPLATE.md) | Stripe | V297 |
| [A treasury workflow in floating panels](motion-c1bd6fc5-060a-4807-82e3-d3b059a82f53/TEMPLATE.md) | Stripe | V298 |
| [A serif typeface as an engineering specimen](motion-12b62792-b531-40ce-858b-599564a602ac/TEMPLATE.md) | Vercel | V154 |
| [A stable name for changing models](motion-31118b3d-7967-4181-b00d-58c291793142/TEMPLATE.md) | Vercel | V279 |
| [Drop an image into a note](motion-5a047c70-9589-404f-a761-03273bc226ad/TEMPLATE.md) | Raycast | V158 |
| [A multi-feature workspace launch](motion-b3c16f52-d4d1-4686-b95b-41af9f5889ed/TEMPLATE.md) | Genspark | V116 |
| [An engineered racing identity](motion-7524e275-4fe8-44a9-b210-7b353b8e80ab/TEMPLATE.md) | Anduril | V118 |
| [An application grows into a system](motion-9478f886-91af-4107-91f1-fb00c57d78e3/TEMPLATE.md) | Zaro | V120 |
| [Security data from scale to result](motion-a4339fcf-8c17-4b3b-9d19-4735444bc160/TEMPLATE.md) | Firecrawl | V121 |
| [A people search becomes a directory](motion-133fd03a-4447-4e39-9b68-a74439ab34c0/TEMPLATE.md) | Firecrawl | V122 |
| [The web becomes structured input](motion-7bec0070-f5ea-4cf5-a22c-3a02c16535fa/TEMPLATE.md) | Firecrawl | V123 |
| [From a brand URL to an ad family](motion-9fc27ae8-90f1-4745-af4f-00f390c206a2/TEMPLATE.md) | Krea | V126 |
| [A collaborative graph writes its own title](motion-6b037a5c-ee23-47ce-b312-ba285d5e7ef4/TEMPLATE.md) | Krea | V127 |
| [Two requests turn a sketch into animation](motion-f6663abf-b1a2-40b9-91f2-9d6efcc69f80/TEMPLATE.md) | Krea | V128 |
| [A continuous zoom demonstrates vector clarity](motion-f1c07057-890b-4fdf-af1c-52d7cb621b65/TEMPLATE.md) | Ideogram | V130 |
| [A wireframe tunnel introduces a partnership](motion-0053d84c-c358-4a52-9baa-8d3381e2ca1e/TEMPLATE.md) | Nous Research | V132 |
| [A computing scene dissolves into an emblem](motion-d7eb1cbe-ded7-416a-8772-f4830f41e5a7/TEMPLATE.md) | Nous Research | V133 |
| [A brand symbol becomes a chat tool](motion-0ad92fd0-b2fb-4885-957c-b71152df15fd/TEMPLATE.md) | The Browser Company | V135 |
| [A quiet website with playful cursor trails](motion-018becab-0461-43d9-8e84-79833fd1f831/TEMPLATE.md) | The Browser Company | V136 |
| [A keycap turns into voice typing](motion-a28f0e5d-aa8b-45a7-87f9-9afcac65a09b/TEMPLATE.md) | Granola | V137 |
| [An unfolding device changes the note layout](motion-12cf27b7-0c82-4ccc-8a9a-7eaed902ca19/TEMPLATE.md) | Granola | V138 |
| [One product across a complete launch kit](motion-7f4c8c30-d91d-4e75-b930-057ff030376b/TEMPLATE.md) | Runway | V140 |
| [Status words resolve into a wordmark](motion-fac0e564-4bc2-4c97-be24-3847cbdcdbb5/TEMPLATE.md) | HeyGen | V342 |
| [Recording opens into a multitrack arrangement](motion-734ef479-a7b7-458a-b488-ad0f6a0498b4/TEMPLATE.md) | Suno | V143 |
| [A large version reveal becomes a toggle](motion-23671bf9-0ae8-49d4-be77-62949eaef616/TEMPLATE.md) | Suno | V340 |
| [One conversation produces several formats](motion-315c1cab-71b0-4bec-a20c-b57f2418e88c/TEMPLATE.md) | Replit | V144 |
| [Connections become a large tool ecosystem](motion-1994f1f9-b8ea-4083-8846-1e96e3f05fff/TEMPLATE.md) | Replit | V145 |
| [A prompt becomes a branded presentation](motion-cf8b2e64-684d-4839-a468-64519c92be20/TEMPLATE.md) | Wix（Base44） | V147 |
| [A cube opens to reveal a letter](motion-0dbe4710-8f5a-4cd2-9f05-530371fa899d/TEMPLATE.md) | Harvey | V334 |
| [Information fragments resolve into intelligence](motion-5aff0bef-38fd-465c-b8d0-3b0c964d8149/TEMPLATE.md) | Harvey | V337 |
| [A desktop tool shown through focused actions](motion-342251b9-26fe-45a6-a4fa-697f234c9755/TEMPLATE.md) | Cognition | V150 |
| [Search, assess and hire one candidate](motion-788325cf-3104-4912-904d-ada6ea4615b9/TEMPLATE.md) | Mercor | V151 |
| [Movement reveals patterned glass](motion-1f1a40cc-f473-46f7-badb-953b2fb140c2/TEMPLATE.md) | Nothing | V160 |
| [Personal assistant tasks](motion-b6889c36-8aff-446f-8f2d-f958a8951a4c/TEMPLATE.md) | Meta | V164 |
| [Red wordmark reveal](motion-a36b6646-29bc-4602-8e0b-2139b21f3bf5/TEMPLATE.md) | Palantir | V166 |
| [Payment-to-reporting montage](motion-81a64f50-815d-4e91-846d-9f018e2326be/TEMPLATE.md) | Ramp | V170 |
| [Model availability announcement](motion-b929be12-85e8-4c21-aae1-740250454e39/TEMPLATE.md) | Databricks | V172 |
| [Kinetic manifesto 60s](motion-2fd3fc6b-eec2-4bfb-9a49-6eb04acc5fae/TEMPLATE.md) | TIDAL | V389 |
| [Personal-to-enterprise intelligence](motion-e8b823ee-4201-4eda-a07b-e615407eb80e/TEMPLATE.md) | Glean | V380 |
| [Template browsing and remixing](motion-7d2376c5-2148-44ae-9720-330bc5f64ca9/TEMPLATE.md) | Bolt | V373 |
| [Reusable skills in a builder](motion-664184d9-593e-4984-b473-701248b69cfe/TEMPLATE.md) | Bolt | V374 |
| [Agent-assisted motion editing](motion-f53dad52-9f20-42c5-b5c3-00743ea475b3/TEMPLATE.md) | Jitter | V382 |
| [Typography reflow](motion-9b6da843-20d6-40cc-994e-8e1d38561b5c/TEMPLATE.md) | Modyfi | V360 |
| [Outlined effect modules](motion-d887324f-64c4-4394-a9f7-1504dbfed419/TEMPLATE.md) | Modyfi | V361 |
| [Continuous symbol morphing](motion-68d80741-c336-41ca-848e-7e6103e021e6/TEMPLATE.md) | Modyfi | V362 |
| [Countdown numeral system](motion-36220499-8ac9-4a39-afb9-35bfba462abb/TEMPLATE.md) | Modyfi | V363 |
| [Organic Cloud](motion-d1af6c0e-6066-4444-9b25-8773ad6cf2f8/TEMPLATE.md) | Adobe | V344 |
| [Graphic Cloud](motion-441b7b32-6bcf-43d4-8259-1b292a84e0ec/TEMPLATE.md) | Adobe | V345 |
| [Creative Variations](motion-d9149cb4-6919-4873-aecc-c71b57e848aa/TEMPLATE.md) | Adobe | V346 |
| [Playful Cloud](motion-4950dcca-547a-4ae7-8697-3d86f73eab62/TEMPLATE.md) | Adobe | V347 |
| [Three-form orbital loop](motion-9e426bb2-2a58-41bb-9619-5f700d5228ed/TEMPLATE.md) | GitHub | V349 |
| [Full-frame pattern cycles](motion-e3fe6179-acf0-4e3f-a8fe-27efd50a6d1d/TEMPLATE.md) | Miro | V350 |
| [Product acceleration workflow](motion-4aaa2afc-a75f-4ce4-a3c5-eb620ed706e5/TEMPLATE.md) | Miro | V351 |
| [Review triage](motion-4a137574-5ea8-4e6f-82bd-11ef77c03c55/TEMPLATE.md) | CodeRabbit | V179 |
| [Luminous product announcement](motion-491b2d70-61d6-41e5-84ba-ee611ea9c409/TEMPLATE.md) | Cohere | V181 |
| [Appointment chat loop](motion-887d2d40-3cf1-4a2c-8e38-c5162a0d1598/TEMPLATE.md) | EliseAI | V183 |
| [Search integration demo](motion-4bd122ac-c538-4fc6-a9b4-bfc1357a3f10/TEMPLATE.md) | Exa | V329 |
| [Software factory overview](motion-478a2c75-2a13-435a-9b44-d730aca6c67c/TEMPLATE.md) | Factory | V185 |
| [Material-to-wordmark reveal](motion-250d244e-c34b-42b9-9da9-22d9983c48f5/TEMPLATE.md) | Comfy | V365 |
| [Model inspection workflow](motion-c3a91b2d-1618-4d3c-9446-4f316797dcd9/TEMPLATE.md) | Goodfire | V189 |
| [From individuals to interactions](motion-13ba3942-fd15-40ee-9638-03d1376514db/TEMPLATE.md) | Humans& | V190 |
| [Agent service marketplace](motion-13466eb7-e76a-4f7c-8c4a-cdaa1bac24d8/TEMPLATE.md) | OKX | V196 |
| [Research to decision table](motion-c8db7c7c-819c-486f-b807-a56864837620/TEMPLATE.md) | Parallel Web Systems | V198 |
| [The web as living memory](motion-f8941c74-b760-411c-b92f-6d838250ecc9/TEMPLATE.md) | Parallel Web Systems | V335 |
| [Parallel Web Systems — Agents and context](motion-b954c1dc-91c2-4d5b-bc28-8cfbf156b220/TEMPLATE.md) | Parallel Web Systems | V341 |
| [Slack — slack](motion-d3b9d255-d01d-4f27-a62e-6b68189721a1/TEMPLATE.md) | Slack | V367 |
| [Prime Intellect — PRIME-AGENT](motion-c1930878-a770-486d-b697-a1d0f10089ce/TEMPLATE.md) | Prime Intellect | V203 |
| [Resend — INBOXES](motion-58419346-fa3c-4f7f-8179-9456c2962ef9/TEMPLATE.md) | Resend | V204 |
| [Revolut — EURR](motion-af77653d-96a4-4987-8cca-222a0bdd80d8/TEMPLATE.md) | Revolut | V206 |
| [Airtable — Create an app](motion-a8969c13-c7db-4e76-aa48-cfcb0674cf99/TEMPLATE.md) | Airtable | V354 |
| [Airtable — Custom interfaces](motion-3b1813cf-f2fe-4d8a-add4-8f3a49d06982/TEMPLATE.md) | Airtable | V355 |
| [Goodnotes — Goodnotes](motion-3ce7f525-08cd-4ccb-b3f6-92dc168c28ce/TEMPLATE.md) | Goodnotes | V357 |
| [Cash App — Bank on Cash App.](motion-55c5fe84-fe5f-4be0-aadf-42fbb1c9b9db/TEMPLATE.md) | Cash App | V358 |
| [Telegram — Create your agent](motion-f8c4cf8e-4934-46ac-9185-e43b68be4f50/TEMPLATE.md) | Telegram | V215 |
| [IBM — think](motion-5071dcd7-d5f0-456a-ac4c-37b2b442eb1c/TEMPLATE.md) | IBM | V368 |
| [Uber — PLAN ON A GOOD TIME](motion-d16d6118-7d1f-4450-91b0-c7d48b041162/TEMPLATE.md) | Uber | V219 |
| [Uber — Refill your wallet](motion-4fdcf514-f8fe-4bcc-a037-60482375769c/TEMPLATE.md) | Uber | V332 |
| [Wabi — A new kind of messenger](motion-c6cf01ea-4262-4297-9f62-00f975cba4df/TEMPLATE.md) | Wabi | V222 |
| [Whop — Move your balance](motion-82eeddc5-21ae-40f6-8a68-a7fd352ce92b/TEMPLATE.md) | Whop | V223 |
| [Z.ai — Sketch = Code](motion-65aa721c-db2c-49e1-a84f-1917cd0d1c1e/TEMPLATE.md) | Z.ai | V228 |
| [Beautiful.ai — Build your presentation](motion-9cb4728d-4bb7-4b85-bcf9-9abd33006649/TEMPLATE.md) | Beautiful.ai | V370 |
| [Bluevine — bluevine](motion-45cca1f4-13dd-44f1-a782-552f2d4469fd/TEMPLATE.md) | Bluevine | V371 |
| [Descript — Create social clips](motion-74408712-50e0-43ac-a167-1a11297cdae0/TEMPLATE.md) | Descript | V378 |
| [QuiverAI — Arrow 2.0](motion-71722e89-6acc-44eb-95fd-2e7cb5f2df08/TEMPLATE.md) | QuiverAI | V383 |
| [Rive — Interactive motion](motion-594cffdc-980f-4c79-a85b-3d01b60e871e/TEMPLATE.md) | Rive | V384 |
| [Suki — Presence is powerful](motion-35e8438f-f8e5-4989-a508-fbef1676e739/TEMPLATE.md) | Suki | V385 |
| [Supabase — Explorer & Notebooks](motion-2ca7c87b-23e8-4517-b197-cb5178e8fa76/TEMPLATE.md) | Supabase | V386 |
| [Supabase — Supabase × Gemini](motion-713872a8-8a62-4e4f-abc1-867d74c642e3/TEMPLATE.md) | Supabase | V387 |
| [Supabase — Supabase Pipelines](motion-b7699fbd-9519-4fa6-8d45-f42141378d93/TEMPLATE.md) | Supabase | V388 |
| [Dub — Partner referrals](motion-56a6a8d9-48b7-42b7-8293-5533a0ee633f/TEMPLATE.md) | Dub | V393 |
| [Embedded assistant](motion-be0354b4-c4d9-4c81-bb67-ac16dc065184/TEMPLATE.md) | Mintlify | V394 |
| [Living waveform poster](motion-cbe77bbc-94d8-4035-9507-103deaa025bc/TEMPLATE.md) | Deezer | V397 |
| [Gradient brand statements](motion-9e5e7ea7-05f9-4ad0-9007-692af38ccc55/TEMPLATE.md) | Faculty | V398 |
| [One grid, changing worlds](motion-fe6852d3-cd2e-43f1-924e-c130b1935937/TEMPLATE.md) | Uniqode | V399 |
| [Particle phrase](motion-de5c331a-48e6-4bdb-98da-597d76fa3d77/TEMPLATE.md) | Uniqode | V400 |
| [Typeface to currency](motion-9b6b2260-e3cc-4db4-9e0d-cc9a35057ac5/TEMPLATE.md) | Wise | V401 |

## Acknowledgements

The import records the existing public production publication and its content hash in [catalog.json](catalog.json). Each template links its original reference in `TEMPLATE.md` and preserves measured/inferred provenance in `source/manifest.json`. Reference footage, screenshots, trademarks and fonts retain their original rights. This import does not claim ownership, a new media license, complete reconstruction or visual acceptance of those references.
