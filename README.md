# SkriptStudio

Lokaler Lernarbeitsplatz: Original-PDF links, eigene Rich-Text-Notizen rechts, eindeutig an die jeweilige Seite gebunden. Reine Client-Side-App mit statischem Build für GitHub Pages.

## Projektstatus

Entwicklung und technische Abnahme auf `feat/initial-app` im Repository `teuberleipzig-cpu/skriptstudio`, Draft-PR #1. Schreibzugriff ist seit der erneuten Freigabe am 13.10.2026 bestätigt; echtes Lockfile und Quellcode sind eingecheckt. **Kein Merge, kein Auto-Merge, keine Veröffentlichung freigegeben oder durchgeführt.**

Der [Testbericht](docs/TEST_REPORT.md) nennt den tatsächlich geprüften Commit und die beobachteten Ergebnisse. Eine geschriebene Funktion, ein synthetischer Kerntest und eine vollständige Produktabnahme sind nicht dasselbe. Die früheren lokalen Installations-/Browserblockaden werden nicht als aktuelle GitHub-Buildblockaden dargestellt.

## Funktionen

PDF-Auswahl und Drag-and-drop mit Signatur-/Parserprüfung, SHA-256-Identität und unveränderten Originalbytes. Viewer mit kopierbarem Text-Layer, direkter Seitenwahl, Zoom und An-Breite-Modus. Quill-Editor mit Fett/Kursiv/Unterstrichen/Durchgestrichen, H1–H3, Listen, Einrückung, Ausrichtung, Schrift-/Markerfarben, Undo/Redo und Formatierung entfernen.

IndexedDB speichert große PDFs getrennt von vollständigen Notiz-Deltas. Eine revisionierte Warteschlange bindet jeden Snapshot an Dokument und Seite. Fehler erhalten den Arbeitsspeicherstand; Retry, unabhängige Notizkopie und Notfall-Backup werden angeboten. Web Locks und transaktionale Revisionsprüfungen verhindern unbemerktes Überschreiben.

Notizen- und Vollbackups mit geprüfter Wiederherstellung als neue Projektkopie. Lokale Bibliothek, Lesezeichen und Notizensuche. PDF-Export kopiert Originalseiten und fügt unmittelbar danach automatisch umbrochene A4-Notizseiten mit echtem Text ein. Die PWA-Vorbereitung inventarisiert alle tatsächlichen Buildressourcen einschließlich Exportmodulen und PDF-Ressourcen.

## Entwicklung und Tests

Node **24.21.0** gemäß `.nvmrc` (in GitHub Actions tatsächlich ausgeführt), npm **11.19.0**. Feste direkte Versionen und unverändertes echtes `package-lock.json`; Paket-/Auditnachweise in [DEPENDENCIES.md](docs/DEPENDENCIES.md).

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npx --no-install playwright install --with-deps chromium firefox webkit
npm run build
npm run test:e2e -- --project=chromium
npm run preview
```

Der Dev-Server liegt unter `http://127.0.0.1:5173/skriptstudio/`, der Produktions-Preview unter `http://127.0.0.1:4173/skriptstudio/`. E2E startet den vorher erzeugten Produktionsbuild selbst. `npm run test` beendet sich nach Node-Kerntests und Vitest. `npm run fixtures` erzeugt ausschließlich synthetische PDFs. Firefox/WebKit sind zusätzlich konfiguriert; ausgeführte Browser separat im Testbericht prüfen.

`npm run lint` ist ein TypeScript-AST-Linter für Syntax, Importpfade und ausgewählte Sicherheitsregeln, nicht ESLint und kein Ersatz für den vollständigen Typecheck. `npm run test:core` kann bei vorhandenem TypeScript ohne Frontend-Pakete ausgeführt werden. Historische lokale Blockaden sind keine erfolgreichen Produkt-Browsertests.

## GitHub Pages – erst nach Freigabe

Standardpfad `/skriptstudio/`. `BASE_PATH=/` erzeugt einen Root-Build; andere Unterpfade enden ebenfalls mit `/`, beispielsweise `BASE_PATH=/anderer-name/`. PowerShell: `$env:BASE_PATH="/"`. Worker, Assets, Manifest und Service-Worker-Scope verwenden denselben Pfad. Kein History-Router.

Nach technischer Abnahme und ausdrücklich erteilter Merge-/Veröffentlichungsfreigabe: **Settings → Pages → Source: GitHub Actions**. Den geprüften Stand nach `main` übernehmen und den separaten manuellen Workflow „Pages (explicit approval only)“ mit aktivierter Bestätigung ausführen. Ein Push oder Draft-PR deployed nicht. Der Pages-Workflow prüft Installation, Tests, Build und Chromium erneut und übergibt ausschließlich `dist`. Bis zum beobachteten Deploymenterfolg existiert keine bestätigte Live-App-URL.

## Bedienung und Gerätewechsel

„PDF öffnen“ liest lokal ein, ohne Dokument-Upload. Gleiche PDF-Bytes unter anderem Dateinamen öffnen denselben Arbeitsstand; andere Bytes mit gleichem Namen bleiben getrennt. „Unabhängige Notizkopie“ erzeugt bewusst ein zweites Projekt.

Strg/Cmd+S schreibt offene Änderungen. Strg/Cmd+B/I/U formatiert. Undo/Redo gilt nur für die aktuelle Seitenbearbeitung und wird beim echten Seitenwechsel zurückgesetzt. Alt+Pfeil links/rechts wechselt außerhalb von Editor, Eingabefeldern und Dialogen die Seite, damit macOS-Wortnavigation erhalten bleibt. Der Splitter reagiert auf Pfeiltasten; Pos1/Home oder Doppelklick stellt die Standardaufteilung wieder her. Tab bleibt Fokusnavigation.

Für PC/Mac-Wechsel: „Backup → Vollständiges Projektbackup“, JSON-Datei auf das andere Gerät übertragen, dort über „Backup“ prüfen lassen und als neue Projektkopie importieren. Ein kleineres Notizen-Backup benötigt das identische Original-PDF. Ein PDF-Export ist **kein bearbeitbares Projektbackup**. Heruntergeladene Backups aktualisieren sich nicht automatisch; eine Cloud-Synchronisierung ist nicht implementiert.

## Offline, Sicherheit und Grenzen

Nur „Offline bereit“ bestätigt die vollständige Vorbereitung der Programmressourcen. Ein frisches Browserprofil muss vorher online vorbereitet werden. Ein wartendes Update lädt den bearbeiteten Tab nicht automatisch neu: zuerst speichern und Backup erstellen, dann alle SkriptStudio-Tabs schließen und neu öffnen.

Browserdaten sind weder Backup noch verschlüsselter Tresor. Privatmodus, gelöschte Profile, Quota-Fehler und abrupte Prozessabbrüche können Daten verlieren. Regelmäßige Backups außerhalb des Browserprofils bleiben notwendig. Verschiedene Repository-Pfade derselben github.io-Domain teilen eine Sicherheits-Origin; ein projektspezifischer Datenbankname schützt nicht gegen fremden Code dieser Origin.

150 MiB und 5.000 Seiten sind Eingangslimits, keine Leistungszusage. Keine verschlüsselten PDFs, OCR, eingebetteten Notizbilder/-tabellen oder allgemeine Unicode-/Emoji-Garantie. Digitale Signaturen und sämtliche interaktiven PDF-Funktionen werden beim Zusammenführen nicht garantiert. Bekannte Quill-Auditwarnung und Bewertung: [Abhängigkeiten](docs/DEPENDENCIES.md).

Weitere Dokumentation: [Architektur](docs/ARCHITECTURE.md), [Backupformat](docs/BACKUP_FORMAT.md), [Grenzen](docs/LIMITATIONS.md), [Testbericht](docs/TEST_REPORT.md), [Produktspezifikation](docs/MASTERPROMPT.md).
