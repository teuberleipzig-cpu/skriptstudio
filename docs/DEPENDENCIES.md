# Abhängigkeiten und Sicherheitsbewertung

Stand: 13.10.2026. Alle direkten Versionen sind festgelegt. Laufzeit-CDNs und unkontrollierte latest-Abhängigkeiten werden nicht verwendet.

## Echte Auflösung

Actions-Run **38401700980**, Quellcommit **87a186981f1d176835be870bff8366677640ebda**: npm install --package-lock-only --ignore-scripts und npm ci --ignore-scripts erfolgreich unter Node **24.21.0**, npm **11.19.0** auf Ubuntu 24.04.5. Der unveränderte generierte Lock-Blob ist **272254439f724388d7de018178fd6998ba17e165**, 64.360 Bytes, SHA-256 **d6d25ce4b3f59b22f1bef8a1a1edf4f0066e16cc9b994fb390dd38b124a72801**. Er enthält 127 Paket-/Root-Einträge einschließlich plattformspezifischer optionaler Pakete. Resolved-URLs und Integrity-Angaben wurden geprüft. Die anschließende normale CI verwendet npm ci ohne --ignore-scripts.

Tatsächlich installiert: React/React DOM 19.3.0, Quill 2.0.3, Dexie 4.4.6, pdfjs-dist 6.4.299, pdfmake 0.3.11, pdf-lib 1.17.1, @pdf-lib/fontkit 1.1.1, Vite 8.3.4, Vitest 5.0.4, Playwright 1.64.0, fake-indexeddb 6.2.5, TypeScript 5.8.3, @types/node 25.1.0, @types/react und @types/react-dom 19.0.0. Der vollständige Typecheck prüft deren tatsächlich benutzte APIs zusammen.

Die lokale Chat-Laufzeit hat Node 22.16.0 / npm 10.9.2 und keinen erreichbaren npm-Registry-DNS. Das ist nicht die CI-Laufzeit. Build-/Browserergebnisse werden deshalb als GitHub-Actions-Nachweise dokumentiert.

## Quill-Audit: bekannte verbleibende Warnung

npm audit meldete **eine Low-Schwachstelle**, keine Moderate-/High-/Critical-Funde. Betroffen ist Quill 2.0.3: **GHSA-v3m3-f69x-jf25 / CVE-2025-15056**, XSS im HTML-Export. Die GitHub-Advisory führt keine gepatchte Version auf. Quelle: https://github.com/advisories/GHSA-v3m3-f69x-jf25 (gelesen 13.10.2026).

SkriptStudio ruft keinen Quill-HTML-Export/getSemanticHTML auf. Kanonische Speicherung und PDF-Export verwenden strikt validierte vollständige Delta-Dokumente; Link-, Font-, Size- und beliebige HTML-Attribute gehören nicht zum zulässigen Modell. Clipboard-HTML wird vor der Quill-Konvertierung auf erlaubte Elemente und solide Farben reduziert; externe Ressourcen und Event-Attribute werden entfernt. Backup-Importe durchlaufen nicht den HTML-Pfad.

Bewertung: Der beschriebene HTML-Export-Angriffspfad wird in dieser Architektur nicht angeboten. Dies ersetzt weder Regressionstests noch eine allgemeine Sicherheitsgarantie. Die Warnung wird nicht durch ein ungeprüftes npm audit fix --force oder ein verdecktes Downgrade unterdrückt. Vor Änderung der Quill-Funktionen/Clipboard-Pfade neu bewerten; eine passende Upstream-Korrektur bei Verfügbarkeit prüfen.

## Primärdokumentation

- Quill API und Delta: https://quilljs.com/docs/api und https://quilljs.com/docs/delta
- PDF.js API/Releases: https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html und https://github.com/mozilla/pdf.js/releases
- Dexie-Transaktionen: https://dexie.org/docs/Dexie/Dexie.transaction() (Tabellenarray bei umfangreichen Transaktionen)
- pdfmake 0.3: https://pdfmake.github.io/docs/0.3/ und https://github.com/bpampuch/pdfmake/releases (Promise-getBuffer, neue pageBreakBefore-API, URL-Zugriff gesperrt)
- pdf-lib: https://pdf-lib.js.org/docs/api/classes/pdfdocument
- Vite/Vitest/Playwright: https://vite.dev/guide/ , https://vitest.dev/guide/ , https://playwright.dev/docs/intro

## Actions

Tatsächlich ausgeführte Releases: checkout v7.0.1 = 3d3c42e5aac5ba805825da76410c181273ba90b1; setup-node v7.1.0 = 949feb2413d6458794dcd2491c4babbbce0c15c1; upload-artifact v7.0.2 = cf430e030ddbb5b0abf93d22962f4752f3646cd9. Normale CI hat nur contents:read und speichert synthetische QA-Artefakte, keine produktiven Daten. Merge und Deployment werden dadurch nicht ausgelöst.
