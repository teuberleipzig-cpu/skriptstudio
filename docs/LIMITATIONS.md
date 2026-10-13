# Grenzen und noch offene Abnahme

SkriptStudio ist ein technisch implementierter Review-Stand auf dem Feature-Branch, keine ungeprüft zugesagte Produktionsversion. Aktuelle, tatsächlich ausgeführte Nachweise stehen in TEST_REPORT.md. Fehlende Merge-/Deployment-Freigabe ist getrennt von noch offenen Tests zu beurteilen.

## Bewusste Produktgrenzen

Keine Benutzerkonten, geräteübergreifende automatische Synchronisierung, KI, OCR, Handschrift, Audiobearbeitung oder Bearbeitung der Original-PDFs. Gerätewechsel über ausdrücklich exportierte/importierte JSON-Projektkopien. Keine Bilder, Tabellen, Videos, Links oder Formel-Widgets im Notizeditor. Vollbackups sind unverschlüsselt und benötigen durch Base64 zusätzlichen Platz.

Unverschlüsselte gewöhnliche PDFs; keine Übergehung von Verschlüsselung über ignoreEncryption. Eingangslimit 150 MiB und 5.000 Seiten ist keine Leistungszusage. Quota, Browserprofil, Geräte-RAM und Dokumentkomplexität begrenzen die Praxis. Getestete Größen separat im Testbericht.

Undo-Historie ist nur für die jeweilige Seitenbearbeitung und wird beim Seitenwechsel zurückgesetzt. Browser und PDF haben keine exakte Word-artige Druck-WYSIWYG-Garantie. Der Export nutzt lokal gebündelte Liberation Sans aus PDF.js; nicht jedes Unicode-/Emoji-Zeichen ist abgedeckt. Fehlende Glyphen führen zu einer ausdrücklichen Meldung, nicht zu stillem Entfernen.

Originalseiten werden kopiert, nicht aus Viewer-Screenshots rasterisiert. Dennoch keine Garantie für digitale Signaturen, sämtliche interaktiven Formulare, dokumentweite Bookmarks oder aktive Funktionen des ursprünglichen Gesamt-PDFs. Das Original auf dem Dateisystem bleibt unverändert.

## Speicherung und Sicherheit

Kein absoluter Verlustschutz: unbestätigte Eingaben können bei Prozessabbruch verloren gehen, Browserdaten können gelöscht werden, Privatmodus kann flüchtig sein. Keine Verschlüsselung gegen andere Personen im selben Browserprofil. Browserdaten sind kein Backup.

Mehrere Repository-Pfade auf demselben github.io-Origin sind kein Sicherheitscontainer. Projektspezifische Datenbank-/Cache-Namen verhindern versehentliche Kollisionen, aber nicht absichtlichen fremden Code derselben Origin. Für höheren Schutzbedarf getrennte Origin erwägen, nicht eigenmächtig kostenpflichtig einrichten.

Ohne Web Locks bleiben Revisionsprüfungen aktiv; destruktives Löschen ist dann gesperrt. Backups werden stets als neue Projekte importiert. Kein In-place-Ersetzen und kein unkontrolliertes Zusammenführen. Konflikte können eine bewusste neue Kopie oder einen Rettungsexport erfordern.

Bekannter Low-Auditbefund GHSA-v3m3-f69x-jf25 bei Quill 2.0.3. Der betroffene HTML-Export wird nicht genutzt; Speicherung und PDF-Export verwenden ein validiertes Delta. Diese Einordnung ist keine allgemeine Sicherheitsgarantie. Details und Quelle in DEPENDENCIES.md.

## Offline und Testumfang

Erste Nutzung in einem neuen Browserprofil benötigt Internet. Offline-Bereitschaft muss vollständig verifiziert werden. Kein erzwungener Reload bei Updates; zum kontrollierten Versionswechsel alle alten App-Tabs nach dem Speichern schließen.

Die erfolgreiche Kompilation allein beweist keine korrekten Exporte oder Offline-Funktion. Der erste Browserlauf fand reale Font-/Cachefehler; nachfolgende Korrekturen benötigen einen neuen Lauf. Noch offene Prüfungen werden im Testbericht ausdrücklich geführt, darunter weitere Format-/Recovery-/Plattformtests. WebKit unter Linux ersetzt keinen echten Safari-Test am MacBook.

Pages-Konfiguration, Merge und erste Veröffentlichung sind nicht durchgeführt. Öffentliche App-Verfügbarkeit erst nach beobachtetem Deployment als live bezeichnen.
