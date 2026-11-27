# Graph Report - vip-tools  (2026-11-27)

## Corpus Check
- 57 files · ~73,586 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .ttf 6, (none) 3, .example 1)

## Summary
- 553 nodes · 1416 edges · 16 communities (14 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf76dfd0`
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
- OwnerPanelClient.tsx
- Creator Kit Utilities
- ai-config.ts
- Live Hub & Indonesia Info
- requireXvipUser
- Root Layout & Metadata

## God Nodes (most connected - your core abstractions)
1. `initVipTools()` - 97 edges
2. `next` - 46 edges
3. `updateStore()` - 31 edges
4. `readStore()` - 30 edges
5. `sanitizePublicError()` - 29 edges
6. `toast()` - 25 edges
7. `enterApp()` - 22 edges
8. `safeFetchPublic()` - 19 edges
9. `sanitizePublicUser()` - 17 edges
10. `getCurrentSessionUser()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `resolveEffectiveAiConfig()`  [EXTRACTED]
  app/api/owner/overview/route.ts → lib/server/ai-config.ts
- `GET()` --indirect_call--> `sanitizePublicUser()`  [INFERRED]
  app/api/owner/overview/route.ts → lib/server/store.ts
- `POST()` --calls--> `readAiConfigCookie()`  [EXTRACTED]
  app/api/owner/settings/route.ts → lib/server/ai-config.ts
- `POST()` --calls--> `resolveEffectiveAiConfig()`  [EXTRACTED]
  app/api/owner/settings/route.ts → lib/server/ai-config.ts
- `POST()` --calls--> `requireXvipUser()`  [EXTRACTED]
  app/api/tools/ai-jawab/route.ts → lib/server/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **MattzLM Security & Access Architecture** — prompt_auth_session, prompt_rbac_xvip, prompt_vps_security, prompt_data_store [EXTRACTED 1.00]
- **MattzLM Modern Tool Backends** — prompt_ytmp3_downloader, prompt_music_downloader, prompt_viral_maker, prompt_creator_kit, prompt_live_hub [EXTRACTED 1.00]
- **MattzLM Monochrome & Anti-Slop UI System** — readme_monochrome_theme, prompt_monochrome_globe, prompt_anti_slop_ui [EXTRACTED 1.00]

## Communities (16 total, 2 thin omitted)

### Community 0 - "store.ts"
Cohesion: 0.06
Nodes (82): makeGoogleUsername(), POST(), POST(), POST(), GET(), POST(), POST(), GET() (+74 more)

### Community 1 - "VIP Tools Client Engine"
Cohesion: 0.07
Nodes (92): initVipTools(), addTelegramTool(), applyHomeVideoRotation(), applyTheme(), bindListener(), buildToolCardHtml(), canCurrentUserAccessXvip(), changeMusic() (+84 more)

### Community 2 - "Music Downloader Backend"
Cohesion: 0.08
Nodes (58): assembleSoundCloudAudio(), assertAllowedSoundCloudHost(), AUDIO_CACHE, AudioCacheEntry, cleanVideoTitle(), DeezerTrack, detectUnrequestedVariants(), downloadVerifiedMp3() (+50 more)

### Community 3 - "Media Download & yt-dlp"
Cohesion: 0.14
Nodes (23): extractInput(), POST(), GET(), colorDist(), extractImageBuffer(), POST(), GET(), POST() (+15 more)

### Community 4 - "YouTube Media Provider"
Cohesion: 0.08
Nodes (47): buildProxyUrl(), execFileAsync, MediaFormatItem, POST(), resolveYouTubeFromProvider(), runYtDlp(), tryInstagramEmbed(), buildVideoPayload() (+39 more)

### Community 6 - "Viral Maker & SVG Rendering"
Cohesion: 0.14
Nodes (30): buildIqcSvg(), buildSertifikatSvg(), buildTanyaUstadzSvg(), POST(), xmlEsc(), escXml(), handleJsonActions(), POST() (+22 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "package.json"
Cohesion: 0.07
Nodes (32): dependencies, firebase@^13.4.0, next@^16.0.0, opentype.js@^2.0.0, qrcode@^1.5.4, react-dom@^19.0.0, sharp@^0.35.5, devDependencies (+24 more)

### Community 9 - "Architecture & Design Specs"
Cohesion: 0.15
Nodes (13): Authentication & Session System, Creator Kit (TTS, Translate, QRIS, Game), Atomic JSON Data Store (data/store.json), Live Hub (Entertainment, Anime, Indonesia Info), MattzLM Web Tools & VPS Suite, Music Downloader Realtime (dl_music_dl), Verification & Build Pipeline, Viral Maker & SVG Vector Rendering (+5 more)

### Community 10 - "OwnerPanelClient.tsx"
Cohesion: 0.08
Nodes (30): dynamic, metadata, OwnerPage(), HomePage(), AuditLog, BUILTIN_TOOL_IDS, ChatMessage, CustomTool (+22 more)

### Community 11 - "Creator Kit Utilities"
Cohesion: 0.38
Nodes (9): buildDynamicQris(), crc16Ccitt(), extractYoutubeId(), generateFancyFonts(), generateGameNicks(), mapAlpha(), parseEmvTlv(), POST() (+1 more)

### Community 12 - "ai-config.ts"
Cohesion: 0.14
Nodes (17): buildSystemPrompt(), POST(), AI_CONFIG_COOKIE_NAME, AiCookiePayload, AiKeySource, decryptAiPayload(), DEFAULT_AI_BASE_URL, DEFAULT_AI_MODEL (+9 more)

### Community 14 - "Live Hub & Indonesia Info"
Cohesion: 0.32
Nodes (7): calcWeton(), getZodiac(), HARI_JAWA, KHODAM_LIST, PASARAN, POST(), WMO_ID

### Community 15 - "requireXvipUser"
Cohesion: 0.24
Nodes (12): POST(), POST(), stalkCodashop(), stalkRoblox(), decodeEntities(), POST(), stalkGitHub(), stalkInstagram() (+4 more)

## Knowledge Gaps
- **5 isolated node(s):** `Creator Kit (TTS, Translate, QRIS, Game)`, `Music Downloader Realtime (dl_music_dl)`, `Verification & Build Pipeline`, `YTMP3 Downloader (dl_ytmp3)`, `Quick Search (Ctrl+K / Cmd+K)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 118 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `store.ts` to `Music Downloader Backend`, `Media Download & yt-dlp`, `YouTube Media Provider`, `Viral Maker & SVG Rendering`, `package.json`, `OwnerPanelClient.tsx`, `Creator Kit Utilities`, `ai-config.ts`, `Live Hub & Indonesia Info`, `requireXvipUser`, `Root Layout & Metadata`?**
  _High betweenness centrality (0.515) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `initVipTools()` (e.g. with `applyTheme()` and `changeMusic()`) actually correct?**
  _`initVipTools()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Creator Kit (TTS, Translate, QRIS, Game)`, `Music Downloader Realtime (dl_music_dl)`, `Verification & Build Pipeline` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057661788044436606 - nodes in this community are weakly interconnected._
- **Why does `initVipTools()` connect `VIP Tools Client Engine` to `OwnerPanelClient.tsx`?**
  _High betweenness centrality (0.284) - this node is a cross-community bridge._
- **Should `VIP Tools Client Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.06749027682452528 - nodes in this community are weakly interconnected._
- **Why does `sanitizePublicError()` connect `Media Download & yt-dlp` to `store.ts`, `Music Downloader Backend`, `ai-config.ts`, `YouTube Media Provider`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._