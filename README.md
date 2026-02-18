# BetterWeb 🌌

<div align="center">

<a href="https://github.com/Heybrono/BetterWeb"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-BetterWeb-181717?style=for-the-badge&logo=github"></a>
<img alt="Chrome Manifest V3" src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white">
<img alt="Status: BETA" src="https://img.shields.io/badge/Status-BETA-f59e0b?style=for-the-badge">
<img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge">

**Advanced Browser Intelligence (BETA)**

Galaxy New Tab · Mod Store · Dev Tools · MV3-safe Mods (no eval)

</div>

> ⚠️ **BETA / Early Access:** BetterWeb ist aktuell **BETA**.
> Dinge können sich ändern, Mods können durch Website-Updates brechen, und es kann Bugs geben.
> Nutze es auf eigenes Risiko.

---

## Inhaltsverzeichnis

- [⬇️ Download & Installation](#️-download--installation)
- [✨ Features](#-features)
- [🧩 Mods & Themes](#-mods--themes)
- [⬇️ ChatGPT Project Downloads (Mod)](#️-chatgpt-project-downloads-mod)
- [🔔 Update- & Wartungs-System](#-update--wartungs-system)
- [🧱 Architektur (kurz)](#-architektur-kurz)
- [🛡️ Sicherheit / Privacy](#️-sicherheit--privacy)
- [📜 License](#-license)

---

## ⬇️ Download & Installation

### Option A (empfohlen): **GitHub Release (nur Extension)**

GitHub kann über **Code → Download ZIP** leider **nicht** nur einen Unterordner (z.B. `/extension`) downloaden – das ist immer das ganze Repo.

Deshalb gibt es (oder soll es geben) einen **Release-Download**, der wirklich nur die Extension enthält:

- **Extension-only ZIP:** https://github.com/Heybrono/BetterWeb/releases/download/extension-latest/BetterWeb-Extension.zip

**Installation:**
1. ZIP entpacken
2. Chrome: `chrome://extensions`
3. **Developer mode** aktivieren
4. **Load unpacked** → Ordner `BetterWeb-Extension/` auswählen

### Option B: Download als ZIP (Builder / Website)

Wenn du den **BetterWeb Extension Builder** nutzt:

1. Im Builder auf **Download Project** klicken
2. ZIP entpacken (z.B. `BetterWeb-Project.zip`)
3. In Chrome: `chrome://extensions`
4. **Developer mode** aktivieren
5. **Load unpacked** → im entpackten ZIP den Ordner auswählen, der die `manifest.json` enthält (Repo-Root)

### Option C: Repo ZIP (GitHub)

- Repo ZIP: https://github.com/Heybrono/BetterWeb/archive/refs/heads/main.zip
- Oder: GitHub → **Code** → **Download ZIP**

Das ist immer das komplette Repo. Extension ist dann im Ordner `extension/`.

---

## ✨ Features

| Bereich | Was du bekommst |
|---|---|
| 🌌 New Tab | Starfield, Galaxy-Gradient, Glass UI, Search Engine Switcher, Recents + Apps Dock |
| 🧩 Mod Store | Installieren/Aktivieren von Mods & Themes (lokal gespeichert) |
| 🛠️ Dev Tools | ShowMode / Media Inspector / Input Tools |
| 🔔 Updates | Update-Popup bei neuer Version + Remote-Wartungssperre via GitHub |

**Wichtig (Manifest V3):** Chrome MV3 blockiert `eval` / `new Function` für Remote-JS.
BetterWeb führt Mods deshalb **MV3-safe** aus (als eingebaute Module im Content Script).

---

## 🧩 Mods & Themes

> **BETA-Hinweis:** Der Store und viele Mods sind experimentell. Manche Mods/Themes können Bugs haben oder sich je nach Website ändern.

- **Registry:** `store/extensions.json`
- **Mods:** laufen auf Webseiten (Content Script) und werden per ID verwaltet (z.B. `mod-whatsapp-galaxy`).
- **Themes:** sind CSS und werden im New Tab als `<style id="bw-custom-theme">` injiziert.

### Enthaltene Mods (Auszug)

| Mod | ID |
|---|---|
| WhatsApp Galaxy Look+ | `mod-whatsapp-galaxy` |
| ChatGPT Galaxy Theme | `mod-chatgpt-galaxy` |
| ChatGPT Project Downloads | `mod-chatgpt-project` |
| ChatGPT Auto-Continue | `mod-chatgpt-autocontinue` |
| YouTube Cinema Mode | `mod-yt-cinema` |
| Speed Reader | `mod-speed-reader` |
| Scroll Progress | `mod-scroll-progress` |
| Untrack Links | `mod-untrack-links` |
| Site Notes | `mod-site-notes` |

---

## ⬇️ ChatGPT Project Downloads (Mod)

Der Mod hängt sich an **chatgpt.com** und hilft dir, aus ChatGPT-Antworten automatisch **ZIPs / Dateien** herunterzuladen.

### Workflow

1. Mod aktivieren
2. Schreibe mit ChatGPT ganz normal
3. Wichtig: Bitte ChatGPT, dass es Dateien **exakt** im Format unten ausgibt
4. Wenn ChatGPT **fertig generiert** hat, erkennt BetterWeb die Dateien automatisch und öffnet ein Download-Popup:
   - ZIP (alle Dateien)
   - oder einzelne Datei

Zusätzlich bleibt unten eine Download-Leiste, sobald Dateien erkannt wurden.

### Erwartetes Ausgabeformat von ChatGPT

```text
--- FILENAME: path/to/file.ext ---
(inhalt)
--- END FILE ---
```

---

## 🔔 Update- & Wartungs-System

BetterWeb lädt beim Start remote diese Datei:

- `extension/version.json`

Damit kannst du:
- **Version hochsetzen** → New Tab zeigt Update-Popup
- **Wartungssperre aktivieren** → Install/Toggle/Run wird blockiert + Grund wird angezeigt

### Beispiel: `extension/version.json`

```json
{
  "version": "1.2.0",
  "github": "https://github.com/Heybrono/BetterWeb",
  "lock": {
    "enabled": false,
    "reason": "Wartung: WhatsApp Mod Fix"
  },
  "message": "Kurze Info, z.B. bekannte Bugs oder Hinweise",
  "news": [
    { "date": "2026-02-17", "title": "Update", "body": "Neue Mods + Fixes" }
  ]
}
```

---

## 🧱 Architektur (kurz)

- `extension/background.js` — Service Worker (Store/Registry, Install/Toggle/Sync/Version-Lock)
- `extension/content-bridge.js` — Content Script: Mod Runner + UI + MV3-safe Implementierungen
- `extension/newtab.html|css|js` — Galaxy New Tab UI
- `store/extensions.json` — Registry (GitHub-hosted)

---

## 🛡️ Sicherheit / Privacy

- Keine Account-Cookies/Session-Cookies werden genutzt.
- Mods laufen lokal im Browser.
- `mod-untrack-links` verändert Links (entfernt Tracking-Parameter).
- `mod-site-notes` speichert Notizen **pro Domain** in `localStorage`.

---

## 📜 License

MIT — © 2026 leon.cgn.lx / Heybrono
