# Graph Report - vip-tools  (2026-11-27)

## Corpus Check
- 56 files · ~72,344 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .ttf 6, (none) 3, .example 1)

## Summary
- 537 nodes · 1368 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7f989301`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- store.ts
- VIP Tools Client Engine
- Music Downloader Backend
- Media Download & yt-dlp
- YouTube Media Provider
- 3D Earth Globe Engine
- Viral Maker & SVG Rendering
- TypeScript Configuration
- package.json
- Architecture & Design Specs
- Owner Panel & Firebase Auth
- Creator Kit Utilities
- updateStore
- readStore
- Live Hub & Indonesia Info
- Social Media Stalker API
- auth.ts
- Root Layout & Metadata

## God Nodes (most connected - your core abstractions)
1. `initVipTools()` - 97 edges
2. `next` - 45 edges
3. `updateStore()` - 31 edges
4. `sanitizePublicError()` - 29 edges
5. `readStore()` - 26 edges
6. `toast()` - 25 edges
7. `enterApp()` - 22 edges
8. `safeFetchPublic()` - 19 edges
9. `sanitizePublicUser()` - 18 edges
10. `getCurrentSessionUser()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --indirect_call--> `sanitizePublicUser()`  [INFERRED]
  app/api/owner/overview/route.ts → lib/server/store.ts
- `PasteViewerPage()` --calls--> `updateStore()`  [EXTRACTED]
  app/p/[id]/page.tsx → lib/server/store.ts
- `POST()` --calls--> `requireXvipUser()`  [EXTRACTED]
  app/api/tools/ai-jawab/route.ts → lib/server/auth.ts
- `HomePage()` --calls--> `VipToolsApp()`  [EXTRACTED]
  app/page.tsx → components/VipToolsApp.tsx
- `VipToolsApp()` --indirect_call--> `signInWithGoogleFirebase()`  [INFERRED]
  components/VipToolsApp.tsx → lib/firebase-client.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **MattzLM Security & Access Architecture** — prompt_auth_session, prompt_rbac_xvip, prompt_vps_security, prompt_data_store [EXTRACTED 1.00]
- **MattzLM Modern Tool Backends** — prompt_ytmp3_downloader, prompt_music_downloader, prompt_viral_maker, prompt_creator_kit, prompt_live_hub [EXTRACTED 1.00]
- **MattzLM Monochrome & Anti-Slop UI System** — readme_monochrome_theme, prompt_monochrome_globe, prompt_anti_slop_ui [EXTRACTED 1.00]

## Communities (18 total, 2 thin omitted)

### Community 0 - "store.ts"
Cohesion: 0.10
Nodes (26): POST(), VALID_THEMES, dynamic, PasteViewerPage(), AuditLogEntry, ChatMessage, CustomTool, FirebaseWebConfig (+18 more)

### Community 1 - "VIP Tools Client Engine"
Cohesion: 0.07
Nodes (92): initVipTools(), addTelegramTool(), applyHomeVideoRotation(), applyTheme(), bindListener(), buildToolCardHtml(), canCurrentUserAccessXvip(), changeMusic() (+84 more)

### Community 2 - "Music Downloader Backend"
Cohesion: 0.08
Nodes (56): assembleSoundCloudAudio(), assertAllowedSoundCloudHost(), AUDIO_CACHE, AudioCacheEntry, cleanVideoTitle(), DeezerTrack, detectUnrequestedVariants(), downloadVerifiedMp3() (+48 more)

### Community 3 - "Media Download & yt-dlp"
Cohesion: 0.09
Nodes (37): buildSystemPrompt(), execFileAsync, POST(), resolveNineRouterApiKey(), buildProxyUrl(), execFileAsync, MediaFormatItem, POST() (+29 more)

### Community 4 - "YouTube Media Provider"
Cohesion: 0.10
Nodes (39): buildVideoPayload(), dynamic, GET(), POST(), runtime, audioBitrateToCnvCode(), CachedYouTubeMedia, DISK_CACHE_DIR (+31 more)

### Community 6 - "Viral Maker & SVG Rendering"
Cohesion: 0.14
Nodes (30): buildIqcSvg(), buildSertifikatSvg(), buildTanyaUstadzSvg(), POST(), xmlEsc(), escXml(), handleJsonActions(), POST() (+22 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "package.json"
Cohesion: 0.07
Nodes (33): dependencies, firebase@^13.4.0, next@^16.0.0, opentype.js@^2.0.0, qrcode@^1.5.4, react-dom@^19.0.0, sharp@^0.35.5, devDependencies (+25 more)

### Community 9 - "Architecture & Design Specs"
Cohesion: 0.15
Nodes (13): Authentication & Session System, Creator Kit (TTS, Translate, QRIS, Game), Atomic JSON Data Store (data/store.json), Live Hub (Entertainment, Anime, Indonesia Info), MattzLM Web Tools & VPS Suite, Music Downloader Realtime (dl_music_dl), Verification & Build Pipeline, Viral Maker & SVG Vector Rendering (+5 more)

### Community 10 - "Owner Panel & Firebase Auth"
Cohesion: 0.08
Nodes (30): dynamic, metadata, OwnerPage(), HomePage(), AuditLog, BUILTIN_TOOL_IDS, ChatMessage, CustomTool (+22 more)

### Community 11 - "Creator Kit Utilities"
Cohesion: 0.38
Nodes (9): buildDynamicQris(), crc16Ccitt(), extractYoutubeId(), generateFancyFonts(), generateGameNicks(), mapAlpha(), parseEmvTlv(), POST() (+1 more)

### Community 12 - "updateStore"
Cohesion: 0.21
Nodes (17): POST(), POST(), POST(), POST(), POST(), VALID_CATEGORIES, POST(), VALID_ROLES (+9 more)

### Community 13 - "readStore"
Cohesion: 0.24
Nodes (17): makeGoogleUsername(), POST(), GET(), GET(), execFileAsync, GET(), safeExec(), createInitialStore() (+9 more)

### Community 14 - "Live Hub & Indonesia Info"
Cohesion: 0.32
Nodes (7): calcWeton(), getZodiac(), HARI_JAWA, KHODAM_LIST, PASARAN, POST(), WMO_ID

### Community 15 - "Social Media Stalker API"
Cohesion: 0.15
Nodes (15): POST(), POST(), POST(), stalkCodashop(), stalkRoblox(), decodeEntities(), POST(), stalkGitHub() (+7 more)

### Community 16 - "auth.ts"
Cohesion: 0.17
Nodes (17): POST(), GET(), POST(), b64urlDecode(), b64urlEncode(), clearSessionCookie(), createSessionToken(), getCurrentSessionUser() (+9 more)

## Knowledge Gaps
- **5 isolated node(s):** `Creator Kit (TTS, Translate, QRIS, Game)`, `Music Downloader Realtime (dl_music_dl)`, `Verification & Build Pipeline`, `YTMP3 Downloader (dl_ytmp3)`, `Quick Search (Ctrl+K / Cmd+K)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Social Media Stalker API` to `store.ts`, `Music Downloader Backend`, `Media Download & yt-dlp`, `YouTube Media Provider`, `Viral Maker & SVG Rendering`, `package.json`, `Owner Panel & Firebase Auth`, `Creator Kit Utilities`, `updateStore`, `readStore`, `Live Hub & Indonesia Info`, `auth.ts`, `Root Layout & Metadata`?**
  _High betweenness centrality (0.516) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `initVipTools()` (e.g. with `applyTheme()` and `changeMusic()`) actually correct?**
  _`initVipTools()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Creator Kit (TTS, Translate, QRIS, Game)`, `Music Downloader Realtime (dl_music_dl)`, `Verification & Build Pipeline` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Why does `initVipTools()` connect `VIP Tools Client Engine` to `Owner Panel & Firebase Auth`?**
  _High betweenness centrality (0.290) - this node is a cross-community bridge._
- **Should `VIP Tools Client Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.06749027682452528 - nodes in this community are weakly interconnected._
- **Why does `sanitizePublicError()` connect `Media Download & yt-dlp` to `Music Downloader Backend`, `YouTube Media Provider`, `readStore`, `Social Media Stalker API`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._