# Architektur

## Modulgrenzen

`app/workspace.ts` ist der langlebige Arbeitszustand; React bezieht unveränderliche Zustandsansichten über `useSyncExternalStore`. UI-Komponenten halten Dialog-, Auswahl- und Darstellungszustände, führen aber keine eigenen unabhängigen Speicherpfade ein. `storage/repositories.ts` kapselt Dexie-Transaktionen; `saveQueue.ts` kennt keinen aktuell angezeigten Editor, sondern ausschließlich gebundene Snapshots.

PDF.js stellt dar; Quill bearbeitet ein eingeschränktes, geprüftes Delta. Backup-Validierung und Delta→pdfmake-Konverter sind DOM-unabhängig. Der vollständige Export läuft in einem eigenen Worker; pdf-lib kopiert Originalseiten und übernimmt die von pdfmake layouteten Textseiten. CSS und alle benötigten Laufzeitressourcen kommen aus dem statischen Build. Ein Server ist zur Benutzung nicht vorgesehen.

## Identität und Datenfluss

Eine UUID identifiziert das annotierte Projekt. Der SHA-256 der unveränderten Originalbytes identifiziert das Asset. Mehrere bewusst erzeugte Projekte dürfen denselben unveränderlichen Blob verwenden, aber niemals dieselbe Notizidentität teilen. Dateinamen sind Anzeige-/Exportmetadaten, keine Identität.

PDF-Import: Größe/Signatur → pdf-lib-Prüfung einschließlich Verschlüsselung → PDF.js-Prüfung → Hash/Seitenanzahl → atomarer Insert einschließlich Asset, Projekt und Sitzung. Ein vorhandenes identisches Asset/Projekt wird innerhalb derselben Transaktion erneut gesucht, damit gleichzeitige Imports keine unbeabsichtigten Kopien erzeugen. Erst nach erfolgreicher Speicherung und vollständigem Lesen des Zielprojekts wird dieses aktiviert. PDF.js bekommt neue Bytearrays; der IndexedDB-Blob wird nicht an einen Worker übertragen und dadurch abgetrennt.

## Speichern und Seitenwechsel

Jeder Benutzer-Edit liest `getContents()` vollständig. Der Snapshot enthält Dokument-ID, nullbasierten Seitenindex und die nächste lokale Revision. Memory wird sofort aktualisiert. Pro Schlüssel werden Writes seriell angeordnet: 350 ms Debounce, spätestens nach 1.500 ms. Eine spätere Revision darf nicht vom Abschluss einer älteren als gespeichert ausgewiesen werden. Fehlgeschlagene Promises werden pro Eintrag behandelt und vergiften die Queue nicht dauerhaft.

Vor einem Seitenwechsel wird der DOM-Zustand synchron abgefragt und die alte Seite geflusht. Das neue Editor-Mount liest den Memory-Zustand seiner eigenen Seite. Sämtliche Notizen des Projekts werden vor dessen Aktivierung gelesen; es gibt keinen verspäteten per-page-Leseeffekt, der eine andere Seite überschreiben könnte. Die Quill-Instanz bleibt beim Tippen/Speichern bestehen; echter Seitenwechsel erzeugt einen separaten Kontext ohne seitenübergreifende Undo-Historie.

Der Viewer hat zusätzlich Cancellation und Generations-IDs. Pro Render wird ein eigener Canvas verwendet. Der alte Inhalt wird beim Wechsel entfernt; Canvas und Text-Layer werden erst nach fertigem passenden Render sichtbar. Aktuelle Seite und Fit-Breite bestimmen das Rendering, nicht alle Seiten gleichzeitig.

Sitzungsdaten werden in einer eigenen seriellen Metadatenqueue mit gebundener Dokument-ID geschrieben. Speicheranzeige aggregiert Notiz- und Sitzungsvorgänge. Kritische Dokumentaktionen sperren die Bearbeitung vom synchronen DOM-Flush bis zum Ende der atomaren Übernahme; insbesondere eine Wiederherstellungskopie darf keine zwischenzeitlich neuen Eingaben verlieren.

## Mehrere Tabs und Konflikte

Web Locks stellen, sofern verfügbar, einen exklusiven Schreibzugriff je Projekt bereit. Der zweite Tab darf lesen und exportieren. Er kann die Bearbeitung erst übernehmen, wenn die Sperre frei ist; es gibt kein gewaltsames Stehlen eines Locks. BroadcastChannel überträgt nur Projekt-IDs, keine Dokumentdaten, und dient lediglich als Änderungsanzeige.

Jeder Notizwrite prüft zusätzlich die erwartete bestätigte Revision innerhalb seiner Dexie-Transaktion. Bei Abweichung werden lokaler Snapshot und vorhandener Remote-Stand in `recoveries` gesichert; erst nach Abschluss dieser Transaktion wird ein Konfliktfehler ausgelöst. Der riskante Schlüssel bleibt eingefroren. Neue Eingaben bleiben im Arbeitsspeicher und können als unabhängige Kopie oder Backup gerettet werden. Höchstens 20 Konflikteinträge je Projekt verhindern unbegrenztes Wachstum.

Ohne Web Locks greift diese optimistische Revisionskontrolle. Destruktives Löschen ist dann bewusst gesperrt, weil eine Revisionsprüfung allein noch nicht geschriebene Änderungen eines anderen Tabs nicht erkennen kann. Import erstellt ausschließlich neue Kopien; ein gefährliches In-place-Ersetzen wird nicht angeboten.

## Export und Backups

`capture()` liest synchron die letzten Editoränderungen und klont Metadaten, ViewState und Memory-Notizen. Ein nachfolgender Flush wird bestmöglich versucht; sein Scheitern verhindert keinen Rettungsexport dieses Snapshots. Spätere Eingaben können nicht teilweise in einen laufenden Export gelangen.

Der Konverter trennt Zeichenformate und Newline-Attribute, erzeugt echte Absätze und verschachtelte Listen und erhält gleichzeitiges Unter-/Durchstreichen. pdfmake erhält A4-Hochformat mit Zuordnung zur Originalseite, Kopf/Fuß und automatischem Umbruch. pdf-lib fügt diese Seiten unmittelbar nach der jeweiligen Originalseite ein. Der Worker meldet tatsächlich abgearbeitete Originalseiten und bisherige Ausgabeseiten. Abbruch beendet den isolierten Worker; es wird kein Teil-PDF heruntergeladen.

Vollbackups enthalten Base64 ausschließlich in der Exportdatei, nicht als Hauptspeicher. Strict-Whitelist-Validierung ersetzt eine zusätzliche Schema-Bibliothek. Unbekannte Felder, Schlüssel, Operationen, Einbettungen, Farben, Versionen und Grenzverletzungen werden abgewiesen. Vor dem Import werden PDF-Bytes erneut geparst und Hash, Größe und Seitenzahl abgeglichen. Die Vorschau verändert nichts; erst die bestätigte neue Kopie wird atomar importiert.

## Schema und Offline-Update

DB-Version 1 enthält Projekte, Assets, Notizen, Sitzungen und Einstellungen. Version 2 ergänzt Konfliktsicherungen und validiert/rederiviert Notiztext in einer erhaltenden Migration. Bei ungültigen Altdaten wird abgebrochen, nicht gelöscht. Backupformat 1 ist davon unabhängig.

`prepare-assets.mjs` kopiert ausschließlich nötige PDF.js-Ressourcen aus derselben installierten Paketversion und erzeugt Manifest und eigene Icons. `build-pwa.mjs` inventarisiert den realen `dist`-Baum nach Vite inklusive Export-/Font-/WASM-Chunks. Inhaltshashes bestimmen projektspezifische Cacheversionen. Erst ein vollständig gefüllter Cache meldet Bereitschaft. Ein unvollständiger Install wird verworfen. Kein `skipWaiting`, kein erzwungener Reload; ein Update wartet auf das Schließen aller alten Clients. Nur alte Caches des eigenen Pfadpräfixes werden entfernt.

## Nachweise

Implementierung, automatische Prüfungen und visuelle Abnahme sind unterschiedliche Stufen. Der aktuelle Testbericht nennt den tatsächlich geprüften Commit und die ausgeführten CI-/Browserprüfungen. Diese Architekturübersicht allein ist kein Erfolgsnachweis.
