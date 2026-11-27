# Graph Report - vip-tools  (2026-11-27)

## Corpus Check
- 59 files · ~78,531 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: .ttf 6, (none) 3, .example 1)

## Summary
- 604 nodes · 1613 edges · 20 communities (18 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `faec8caf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- store.ts
- VIP Tools Client Engine
- Music Downloader Backend
- dependencies
- YouTube Media Provider
- 3D Earth Globe Engine
- Viral Maker & SVG Rendering
- TypeScript Configuration
- package.json
- Architecture & Design Specs
- OwnerPanelClient.tsx
- Creator Kit Utilities
- ai-config.ts
- OwnerPanelClient
- Live Hub & Indonesia Info
- requireXvipUser
- firebase-client.ts
- Root Layout & Metadata
- VipToolsApp.tsx
- scripts

## God Nodes (most connected - your core abstractions)
1. `initVipTools()` - 97 edges
2. `next` - 46 edges
3. `updateStore()` - 36 edges
4. `readStore()` - 31 edges
5. `sanitizePublicError()` - 31 edges
6. `toast()` - 25 edges
7. `resolveEffectiveAiConfig()` - 24 edges
8. `enterApp()` - 22 edges
9. `getEffectiveFirebaseConfig()` - 19 edges
10. `safeFetchPublic()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --indirect_call--> `sanitizePublicUser()`  [INFERRED]
  app/api/owner/overview/route.ts → lib/server/store.ts
- `handleOwnerGoogleLogin()` --calls--> `signInWithGoogleFirebase()`  [EXTRACTED]
  components/OwnerPanelClient.tsx → lib/firebase-client.ts
- `VipToolsApp()` --indirect_call--> `signInWithGoogleFirebase()`  [INFERRED]
  components/VipToolsApp.tsx → lib/firebase-client.ts
- `VipToolsApp()` --indirect_call--> `signOutFirebaseQuietly()`  [INFERRED]
  components/VipToolsApp.tsx → lib/firebase-client.ts
- `GET()` --calls--> `requireOwnerUser()`  [EXTRACTED]
  app/api/owner/overview/route.ts → lib/server/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **MattzLM Security & Access Architecture** — prompt_auth_session, prompt_rbac_xvip, prompt_vps_security, prompt_data_store [EXTRACTED 1.00]
- **MattzLM Modern Tool Backends** — prompt_ytmp3_downloader, prompt_music_downloader, prompt_viral_maker, prompt_creator_kit, prompt_live_hub [EXTRACTED 1.00]
- **MattzLM Monochrome & Anti-Slop UI System** — readme_monochrome_theme, prompt_monochrome_globe, prompt_anti_slop_ui [EXTRACTED 1.00]

## Communities (20 total, 2 thin omitted)

### Community 0 - "store.ts"
Cohesion: 0.06
Nodes (72): makeGoogleUsername(), POST(), POST(), POST(), GET(), POST(), POST(), GET() (+64 more)

### Community 1 - "VIP Tools Client Engine"
Cohesion: 0.06
Nodes (94): initVipTools(), addTelegramTool(), applyHomeVideoRotation(), applyTheme(), bindListener(), buildToolCardHtml(), canCurrentUserAccessXvip(), changeMusic() (+86 more)

### Community 2 - "Music Downloader Backend"
Cohesion: 0.08
Nodes (56): assembleSoundCloudAudio(), assertAllowedSoundCloudHost(), AUDIO_CACHE, AudioCacheEntry, cleanVideoTitle(), DeezerTrack, detectUnrequestedVariants(), dynamic (+48 more)

### Community 3 - "dependencies"
Cohesion: 0.15
Nodes (11): dependencies, firebase@^13.4.0, next@^16.0.0, opentype.js@^2.0.0, qrcode@^1.5.4, react@^19.0.0, react-dom@^19.0.0, opentype.js (+3 more)

### Community 4 - "YouTube Media Provider"
Cohesion: 0.06
Nodes (70): buildProxyUrl(), execFileAsync, MediaFormatItem, POST(), resolveYouTubeFromProvider(), runYtDlp(), tryInstagramEmbed(), extractInput() (+62 more)

### Community 6 - "Viral Maker & SVG Rendering"
Cohesion: 0.12
Nodes (32): buildIqcSvg(), buildSertifikatSvg(), buildTanyaUstadzSvg(), POST(), xmlEsc(), escXml(), handleJsonActions(), POST() (+24 more)

### Community 7 - "TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 8 - "package.json"
Cohesion: 0.16
Nodes (16): devDependencies, @types/node@^22.0.0, @types/opentype.js@^1.3.10, @types/qrcode@^1.5.6, @types/react@^19.0.0, @types/react-dom@^19.0.0, typescript@^5.7.0, name (+8 more)

### Community 9 - "Architecture & Design Specs"
Cohesion: 0.15
Nodes (13): Authentication & Session System, Creator Kit (TTS, Translate, QRIS, Game), Atomic JSON Data Store (data/store.json), Live Hub (Entertainment, Anime, Indonesia Info), MattzLM Web Tools & VPS Suite, Music Downloader Realtime (dl_music_dl), Verification & Build Pipeline, Viral Maker & SVG Vector Rendering (+5 more)

### Community 10 - "OwnerPanelClient.tsx"
Cohesion: 0.18
Nodes (10): AuditLog, BUILTIN_TOOL_IDS, ChatMessage, CustomTool, formatUptime(), OverviewData, PasteSummary, PublicUser (+2 more)

### Community 11 - "Creator Kit Utilities"
Cohesion: 0.38
Nodes (9): buildDynamicQris(), crc16Ccitt(), extractYoutubeId(), generateFancyFonts(), generateGameNicks(), mapAlpha(), parseEmvTlv(), POST() (+1 more)

### Community 12 - "ai-config.ts"
Cohesion: 0.07
Nodes (70): GET(), dynamic, execFileAsync, GET(), safeExec(), buildAiConfigResponse(), dynamic, POST() (+62 more)

### Community 13 - "OwnerPanelClient"
Cohesion: 0.29
Nodes (8): OwnerPanelClient(), buildAiHeaders(), handleConfirmClearAiSecret(), handleLogout(), handleOwnerGoogleLogin(), handleSaveAiSecret(), handleTestAiConnection(), signOutFirebaseQuietly()

### Community 14 - "Live Hub & Indonesia Info"
Cohesion: 0.32
Nodes (7): calcWeton(), getZodiac(), HARI_JAWA, KHODAM_LIST, PASARAN, POST(), WMO_ID

### Community 15 - "requireXvipUser"
Cohesion: 0.16
Nodes (17): buildSystemPrompt(), dynamic, POST(), POST(), POST(), POST(), stalkCodashop(), stalkRoblox() (+9 more)

### Community 16 - "firebase-client.ts"
Cohesion: 0.43
Nodes (6): fetchFirebaseWebConfig(), getEnvConfig(), getFirebaseOwnerSession(), PublicFirebaseConfig, signInWithGoogleFirebase(), firebase

### Community 18 - "VipToolsApp.tsx"
Cohesion: 0.53
Nodes (4): HomePage(), callGlobal(), VipToolsApp(), cleanup()

### Community 19 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, graph:query, graph:update, start

## Knowledge Gaps
- **5 isolated node(s):** `Creator Kit (TTS, Translate, QRIS, Game)`, `Music Downloader Realtime (dl_music_dl)`, `Verification & Build Pipeline`, `YTMP3 Downloader (dl_ytmp3)`, `Quick Search (Ctrl+K / Cmd+K)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 125 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `store.ts` to `Music Downloader Backend`, `dependencies`, `YouTube Media Provider`, `Viral Maker & SVG Rendering`, `package.json`, `OwnerPanelClient.tsx`, `Creator Kit Utilities`, `ai-config.ts`, `Live Hub & Indonesia Info`, `requireXvipUser`, `Root Layout & Metadata`, `VipToolsApp.tsx`?**
  _High betweenness centrality (0.486) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `initVipTools()` (e.g. with `applyTheme()` and `changeMusic()`) actually correct?**
  _`initVipTools()` has 23 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Creator Kit (TTS, Translate, QRIS, Game)`, `Music Downloader Realtime (dl_music_dl)`, `Verification & Build Pipeline` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.060246360582306833 - nodes in this community are weakly interconnected._
- **Why does `initVipTools()` connect `VIP Tools Client Engine` to `VipToolsApp.tsx`?**
  _High betweenness centrality (0.264) - this node is a cross-community bridge._
- **Should `VIP Tools Client Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.06374921102461603 - nodes in this community are weakly interconnected._
- **Why does `sanitizePublicError()` connect `YouTube Media Provider` to `store.ts`, `Music Downloader Backend`, `ai-config.ts`, `requireXvipUser`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._