# Testbericht – SkriptStudio

Stand: 13.10.2026. Repository `teuberleipzig-cpu/skriptstudio`, Feature-Branch `feat/initial-app`, Draft-PR #1. Die vorhandene vollständige CI ist grün. Das ist ein nachgewiesen funktionsfähiger Review-Stand, nicht die Behauptung, sämtliche weitergehenden Abnahmeanforderungen des Masterprompts seien bereits getestet.

## Verifizierter Code und Lauf

Geprüfter Feature-Commit: **c7c20a0d5e865766714bf8c9f8b5967055857daf**.

Erfolgreicher CI-Lauf: **38409793382**, Job **115338782108**. Quell- und Testartefakte **11821170472** wurden heruntergeladen und unabhängig ausgewertet. Der Test-Checkout ist GitHubs synthetischer PR-Testmerge **38c74ab6ac9bd31464cb395e9d774f98c1ca9ac1**; dies ist kein Merge nach main. Der vorliegende Bericht wird nach dem bereits geprüften Code geschrieben und erfindet keinen eigenen zukünftigen Commit-SHA.

Laufzeit: Ubuntu 24.04.5, Node **24.21.0**, npm **11.19.0**, TypeScript **5.8.3**, Chromium **151.0.7897.14**, Playwright **1.64.0**. Weitere exakte Paketversionen und das echte Lockfile sind in DEPENDENCIES.md dokumentiert.

| Prüfung | Beobachtetes Ergebnis |
|---|---|
| `npm ci` mit echtem eingechecktem Lockfile | Bestanden |
| `npm run lint` | Bestanden |
| `npm run typecheck` – gesamtes Strict-TypeScript-Projekt | Bestanden |
| Node-Kerntests: Delta, Backup, SaveQueue, Exportmodell, PWA-Generator | **72/72 bestanden** |
| Vitest: echte Dexie-Funktionen mit fake-indexeddb und installierte Exportfonts | **11/11 bestanden** |
| `npm run build` | Bestanden; statischer Produktionsbuild inklusive Offline-Ressourcen |
| Chromium gegen `/skriptstudio/` | **16/16 bestanden**, keine Wiederholungs-Erfolge, keine übersprungenen Fälle |

Der tatsächliche Playwright-HTML-Bericht bestätigt `total=16`, `expected=16`, `unexpected=0`, `flaky=0`, `skipped=0`. Insgesamt 99 bestandene automatisierte Testfälle unterschiedlicher Ebenen; nicht 99 vollständige unabhängige Produktabnahmen.

## Was die Browserprüfungen belegen

PDF-Import und sichtbare erste Seite; schnelle Notizwechsel auf drei Seiten; Reload nach bestätigtem Save; Navigation und Grenzen. Identische PDF-Bytes unter anderem Namen öffnen denselben Stand; unterschiedliche Bytes mit gleichem Namen bleiben getrennt. Abgelehnte Dateien verändern die bisherigen Notizen nicht.

Ein zweiter Tab ist schreibgeschützt; nach Schließen des ersten Tabs lässt sich die Bearbeitung übernehmen. Ansichten mit 1440, 1024, 768 und 390 Pixeln Breite werden geprüft. Desktop- und Smartphone-Screenshots wurden zusätzlich visuell betrachtet. Ein 300-Seiten-Dokument und ein bildlastiges 32-Seiten-Dokument werden geöffnet und zu ihren letzten Seiten navigiert.

Vollbackup direkt nach Eingabe wird in einem frischen Browserkontext wiederhergestellt, einschließlich Lesezeichen und Statistikzeichen. Ein reines Notizen-Backup verlangt das identische Original; falsche Bytes werden abgewiesen. Ein ungültiger Folgeimport entfernt die zuvor gültige Importvorschau, statt deren Zustand versehentlich weiterzuverwenden.

Die Toolbar-Prüfung kombiniert Fett, Kursiv, Unterstreichen, Durchstreichen, Schriftfarbe, Markerfarbe und Blocksatz und kontrolliert den tatsächlich exportierten Delta-Zustand. Undo auf einer zweiten Seite verändert die erste Seite nicht.

Der Offline-Test bereitet Ressourcen online vor, schließt den Tab, sperrt das Netzwerk und öffnet die App in einem neuen Tab. Lesen, Weiterbearbeiten, Speichern, erster PDF-Export in dieser Sitzung und Backup-Import bestehen. Fremde App-Caches bleiben erhalten. In diesem Netzwerktest wurden keine fremden HTTP(S)-Ziele oder fehlgeschlagenen Ressourcenrequests festgestellt.

## Unabhängige Prüfung der tatsächlichen Export-PDFs

Die exportierten PDFs wurden zusätzlich außerhalb der Anwendung mit PyMuPDF gelesen. Repräsentative Notizseiten, die kombinierte Formatseite und die letzte lange Notizseite wurden gerendert und visuell betrachtet.

- Leer-Auslassung an: **5 Seiten** in der Reihenfolge Original 1, Notiz 1, Original 2, Notiz 2, Original 3. Leer-Auslassung aus: **6 Seiten**, zusätzlich eine leere Notizseite nach Original 3.
- Originalformate bleiben gemischt; die dritte Originalseite behält 90°-Rotation und CropBox. Neue Notizseiten sind A4-Hochformat.
- Der Notiztext enthält auswählbar/extrahierbar **äöüß, α, β, μ, σ, Δ, ≤, ≥, ±, ² und →**.
- Die Formatseite enthält LiberationSans-BoldItalic in der gewählten Schriftfarbe **#123456**; gelber Hintergrund sowie gleichzeitiges Unter- und Durchstreichen sind im gerenderten PDF sichtbar.
- Der Langexport hat **25 Gesamtseiten**, davon **22 Notizseiten** zu Originalseite 1. Nach Entfernung der wiederkehrenden Kopf-/Fußzeilen und Normalisierung von Leerraum entspricht der gesamte extrahierte Notiztext exakt dem erwarteten Inhalt: Startmarker, 1.800 Wiederholungen des synthetischen Beispielsatzes, Endmarker. Der Endmarker steht auf der letzten Notizseite; danach folgen Original 2 und Original 3. Keine zusätzliche absatzabstandsbedingte Leerseite.

## Gefundene und behobene Fehler

Der erste vollständige Typecheck fand zwei Quill-Delta-Typschnittstellenfehler und einen Dexie-Transaktions-Overload; sie wurden behoben, ohne Prüfeinstellungen abzuschalten. Die erste Browserprüfung fand eine fehlende Pfeil-Glyphe im ursprünglichen Roboto-Exportfont und einen Offline-Cache-Miss durch `Vary: Origin`. Der Export verwendet jetzt vier geprüfte Liberation-Sans-Schnitte aus der vorhandenen PDF.js-Abhängigkeit. Cache-Abgleich ignoriert Vary ausschließlich für exakt inventarisierte eigene statische Ressourcen.

Zwei Importtests warteten zunächst auf schon vorher vorhandene Zustände statt auf den Abschluss der laufenden Prüfung; sie warten jetzt auf echte Parser-/Hash-Ergebnisse. Ein Farbtest schrieb zunächst denselben bereits angezeigten Standardwert und löste damit kein Change-Ereignis aus; er testet nun eine tatsächliche Farbänderung. Der letzte Absatzabstand langer Exporte erzeugte eine zusätzliche inhaltsleere Seite; terminale Abstände werden gezielt entfernt, tatsächlich eingegebene leere Absätze bleiben erhalten.

## Testdaten, Sicherheit und verbleibende Abnahme

Ausschließlich synthetische Testdaten. 300 Seiten: **124.125 Bytes**. Bildlastige 32 Seiten: **25.185.255 Bytes**, etwa 24,0 MiB. Diese Fälle sind keine Leistungszusage für die technischen Eingangslimits 150 MiB oder 5.000 Seiten.

Das Audit meldet weiterhin eine bekannte **Low-Warnung bei Quill 2.0.3** für einen HTML-Exportpfad, den diese Anwendung nicht anbietet. Keine pauschale Sicherheitsgarantie; Details in DEPENDENCIES.md. Die lokale Chat-Laufzeit kann weiterhin nicht regulär über npm installieren; der nachgewiesene vollständige Installations-/Build-/Browserweg ist GitHub Actions.

Noch nicht vollständig nachgewiesen: echte Browser-Quota-/Recovery-Simulation mit absichtlich verzögerten Transaktionen; persistentes Profil über einen vollständigen Browserprozess-Neustart; sämtliche Überschriften-, Listen-, Einrückungs- und Clipboard-Sicherheitsfälle; der gesonderte exakte Sieben-Seiten-Referenzfall; realer App-Versionswechsel mit mehreren Tabs; IME, Screenreader und native Windows-/macOS-Prüfung. Firefox und WebKit sind konfiguriert, aber noch nicht ausgeführt. Isolierte Queue-/Datenbanktests sind kein Ersatz für diese zusätzlichen Browserfälle.

## Freigabe und Veröffentlichung

Kein Merge, kein Auto-Merge, kein erster Live-Deploy. Main bleibt bei **be38f8456fe033aff8cc661d6446c18178fba9ed**. Der Pages-Workflow ist vorbereitet und verlangt main plus ausdrückliche manuelle Bestätigung; er wurde nicht ausgeführt. Eine Live-App-URL ist nicht bestätigt. Die Repository-Schreibfreigabe ist erledigt; für weitere Code-/Testarbeit ist aktuell keine zusätzliche Nutzerberechtigung erforderlich.
