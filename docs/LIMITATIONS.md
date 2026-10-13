# Grenzen und noch offene Abnahme

SkriptStudio hat am Feature-Commit c7c20a0d5e865766714bf8c9f8b5967055857daf eine erfolgreiche vollständige CI mit 72 Kerntests, 11 Integrations-/Fonttests und 16 Chromium-Browserfällen. Tatsächliche Exporte wurden zusätzlich gelesen und repräsentative Seiten visuell geprüft. Die im Review gefundenen Font-, Offline-Cache- und terminalen Seitenabstandsfehler sind im geprüften Stand behoben. Nachweise und verbleibende Tests: TEST_REPORT.md.

Die bestandene vorhandene Testsuite ist keine Behauptung, sämtliche weitergehenden Anforderungen des Masterprompts seien abgenommen. Der PR bleibt ein Draft. Fehlende Merge-/Deployment-Freigabe und noch nicht ausgeführte Tests sind getrennte Sachverhalte.

## Bewusste Produktgrenzen

Keine Benutzerkonten, automatische geräteübergreifende Synchronisierung, KI, OCR, Handschrift, Audiobearbeitung oder Bearbeitung der Original-PDFs. Gerätewechsel über ausdrücklich exportierte/importierte JSON-Projektkopien. Keine Bilder, Tabellen, Videos, Links oder Formel-Widgets im Notizeditor. Vollbackups sind unverschlüsselt und benötigen durch Base64 zusätzlichen Platz.

Nur gewöhnliche unverschlüsselte PDFs; keine Übergehung von Verschlüsselung über ignoreEncryption. Eingangslimit 150 MiB und 5.000 Seiten ist keine Leistungszusage. Quota, Browserprofil, Geräte-RAM und Dokumentkomplexität begrenzen die Praxis. Getestete Größen stehen im Testbericht.

Undo gilt nur für die jeweilige Seitenbearbeitung und wird beim Seitenwechsel zurückgesetzt. Browser und PDF haben keine exakte Word-artige Druck-WYSIWYG-Garantie. Der Export nutzt lokal gebündelte Liberation Sans aus PDF.js; nicht jedes Unicode-/Emoji-Zeichen ist abgedeckt. Fehlende Glyphen lösen eine ausdrückliche Meldung aus und werden nicht still entfernt.

Originalseiten werden kopiert, nicht aus Viewer-Screenshots rasterisiert. Dennoch keine Garantie für digitale Signaturen, sämtliche interaktiven Formulare, dokumentweite Bookmarks oder aktive Funktionen des ursprünglichen Gesamt-PDFs. Das Original auf dem Dateisystem bleibt unverändert.

## Speicherung und Sicherheit

Kein absoluter Verlustschutz: unbestätigte Eingaben können bei Prozessabbruch verloren gehen, Browserdaten können gelöscht werden, Privatmodus kann flüchtig sein. Keine Verschlüsselung gegen andere Personen im selben Browserprofil. Browserdaten sind kein Backup.

Mehrere Repository-Pfade auf demselben github.io-Origin sind kein Sicherheitscontainer. Projektspezifische Datenbank-/Cache-Namen verhindern versehentliche Kollisionen, aber nicht absichtlichen fremden Code derselben Origin. Für höheren Schutzbedarf ist eine getrennte Origin eine mögliche spätere Bereitstellungsentscheidung.

Ohne Web Locks bleiben Revisionsprüfungen aktiv; destruktives Löschen ist dann gesperrt. Backups werden stets als neue Projekte importiert. Kein In-place-Ersetzen und kein unkontrolliertes Zusammenführen. Konflikte können eine bewusste neue Kopie oder einen Rettungsexport erfordern.

Bekannter Low-Auditbefund GHSA-v3m3-f69x-jf25 bei Quill 2.0.3. Der betroffene HTML-Export wird nicht genutzt; Speicherung und PDF-Export verwenden validierte Deltas. Diese Einordnung ist keine allgemeine Sicherheitsgarantie. Details und Quelle in DEPENDENCIES.md.

## Offline und Plattformen

Die erste Nutzung eines neuen Browserprofils benötigt Internet. Der Chromium-Test belegt den vorbereiteten Offline-Neustart in einem neuen Tab samt erstem Export. Er ist kein Nachweis sämtlicher Browser-/Betriebssystemkombinationen oder eines vollständigen Browserprozess-Neustarts. Ein Update lädt keinen Tab ungefragt neu; nach dem Sichern alle alten App-Tabs schließen.

Zusätzliche Browser-Fehler- und Plattformtests sind offen, darunter verzögerte Transaktionen/Quota-Recovery im echten Browser, sämtliche Format-/Clipboard-Fälle, der exakte Sieben-Seiten-Referenzfall, Multi-Tab-Versionswechsel, IME/Screenreader und ein persistentes Profil über Prozessneustart. Firefox/WebKit und native Windows-/macOS-Tests wurden noch nicht ausgeführt. WebKit unter Linux würde ohnehin keinen echten Safari-Test am MacBook ersetzen.

Pages-Konfiguration, Merge und erste Veröffentlichung sind nicht durchgeführt. Öffentliche App-Verfügbarkeit wird erst nach beobachtetem Deployment als live bezeichnet.
