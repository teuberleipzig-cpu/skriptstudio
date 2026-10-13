# Testbericht – SkriptStudio

Datum: 13.10.2026. Entwicklung auf `feat/initial-app`, Draft-PR #1. Kein Merge oder Deployment. Dieser Zwischenbericht nennt beobachtete Ergebnisse und wird nach dem Korrekturlauf aktualisiert.

## Nachweise bis zum letzten ausgewerteten Lauf

Paketauflösung: Run **38401700980**, Quellcommit **87a186981f1d176835be870bff8366677640ebda**, Node 24.21.0, npm 11.19.0, Ubuntu 24.04.5. Echte Installation und Lockfile-Auflösung erfolgreich; Lock unverändert eingecheckt. Weitere Paketversionen und Quill-Auditbewertung: DEPENDENCIES.md.

Erster vollständiger CI-Lauf **38404645537** am Quellcommit **4b8a2f5de91a62a35ba904b49d87464861607591**: npm ci und Lint erfolgreich, Typecheck meldete zwei Quill-AttributeMap-Typfehler und einen Dexie-Transaktions-Overload. Diese drei Fehler wurden in **5a00a254738e10d899a9f6ba90da0845ca8838ab** korrigiert, ohne Prüfregeln abzuschalten.

CI-Lauf **38404983789** an **5a00a254738e10d899a9f6ba90da0845ca8838ab**, synthetischer PR-Testmerge **d08f95f7b7136c8f635aa080e5727e3762d7c975**: sauberes npm ci, Lint, vollständiger strikter Typecheck, Kern-/Datenbanktests, Produktionsbuild und Chromium-Installation erfolgreich. Ein synthetischer Testmerge unter refs/pull ist keine Übernahme nach main.

Der heruntergeladene Playwright-HTML-Bericht aus Artefakt **11818897470** enthält **15 Chromium-Tests: 10 bestanden, 5 fehlgeschlagen, 0 flaky, 0 übersprungen**. Die Testartefakte wurden direkt ausgewertet; eine zunächst irreführende aggregierte Logdarstellung wurde nicht als finale Ergebniszählung übernommen.

Bestanden in diesem Lauf: Drei-Seiten-Bindung mit Reload, abgewiesene PDFs ohne Datenverlust, Zwei-Tab-Schreibsperre und Übernahme, vier Ansichtsbreiten, 300-Seiten-/bildlastiger Import, Vollbackup in frischem Browserkontext sowie Erzeugung eines langen Exports. Die damalige Langexportprüfung belegte nur die Seitenanzahl, noch nicht den Endmarker.

Fehlerursachen aus Screenshots/Traces:

1. Zwei Exporttests wurden durch die korrekte Glyphenprüfung abgebrochen: „→“ fehlte im vorher verwendeten Roboto-Schriftpaket. Keine stille Zeichenauslassung.
2. Offline-Neustart lud die HTML-Shell, aber JS/CSS verfehlten den Cache durch `Vary: Origin` zwischen Installations- und Modulrequests. Offline war damit noch nicht bestanden.
3. Zwei Importtests prüften bereits vorhandenen Text beziehungsweise einen ohnehin deaktivierten Button statt den Abschluss des vorherigen Imports. Sie konnten dadurch einen weiteren Import während des laufenden Vorgangs anstoßen; die App wies diesen ab.

## Korrekturen in diesem nachfolgenden Quellstand

Export verwendet die vier Liberation-Sans-Schnitte aus der bereits fest gepinnten PDF.js-Abhängigkeit, lädt sie ausschließlich aus lokalen vorbereiteten Ressourcen und prüft weiterhin sämtliche Glyphen. Vier neue Tests prüfen Umlaute/Statistikzeichen einschließlich Pfeil gegen die echten installierten Fonts. Es wurden keine privaten Systemschriften hinzugefügt.

Der Service Worker gleicht `Vary` nur für exakt inventarisierte statische Same-Origin-Ressourcen ab; nicht für Nutzerdaten, externe Ressourcen oder beliebige Queryvarianten. Die Cacheidentität enthält zusätzlich die geänderte Workerlogik. Die strenge Dateiliste und fremde App-Caches bleiben erhalten.

Importtests warten nun auf tatsächliche Parser-/Hash-Ergebnisse beziehungsweise den aktivierten Öffnen-Button. Neue Browserprüfung für kombinierte Toolbar-Formate, Schrift-/Markerfarbe, Blocksatz und getrennte Undo-Historie. Langexport wird erneut in PDF.js geöffnet und auf Anfang, Ende sowie nachfolgende Originalseite geprüft. Synthetische Ergebnis-PDFs werden für unabhängige Sichtprüfung als CI-Artefakte erhalten.

**Die Ergebnisse dieses Korrekturlaufs sind zum Schreiben dieses Zwischenberichts noch nicht beobachtet.**

## Testdaten und Grenzen

Nur programmgenerierte synthetische PDFs, keine echten Vorlesungsinhalte oder privaten Notizen. Gemischtes 3-Seiten-PDF mit Hoch-/Querformat, CropBox und 90°-Rotation. 300-Seiten-Datei: 124.125 Bytes. Bildlastig: 32 Seiten, 25.185.255 Bytes (rund 24,0 MiB). Das sind getestete Fälle, keine Zusage für das Eingangslimit 150 MiB/5.000 Seiten.

Die lokale Chat-Laufzeit konnte weiterhin keine Pakete über die Registry installieren; maßgeblicher Build-/Browsertestweg ist GitHub Actions. 70 historische lokale Kerntests allein gelten nicht als App-Abnahme.

Noch separat nachzuweisen: vollständige visuelle PDF-Abnahme nach Fontwechsel, alle Heading-/Listen-/Einrückungsfälle, exakter Sieben-Seiten-Referenzfall, echter Browser-Quota-/Recovery-Fehlerpfad mit verzögerten Transaktionen, persistentes Browserprofil über einen Prozessneustart, Updatewechsel mit mehreren Tabs, IME/Screenreader und native Windows-/macOS-Prüfung. Firefox und WebKit sind konfiguriert, aber bisher nicht ausgeführt. Quill-Low-Auditwarnung bleibt dokumentiert.

## Veröffentlichung

main bleibt bei **be38f8456fe033aff8cc661d6446c18178fba9ed**. Der separate Pages-Workflow ist technisch vorbereitet und verlangt main plus ausdrückliche manuelle Bestätigung. Er wurde nicht ausgeführt; keine Live-App-URL bestätigt.
