# Backupformat 1

Die maßgebliche ausführbare Definition ist `src/features/backup/backupSchema.ts`; erweiterte Whitelist-Prüfungen liegen in `features/notes/delta.ts`.

| Feld | Bedeutung |
|---|---|
| `format` | Genau `skriptstudio-project` |
| `schemaVersion` | Genau `1`, unabhängig von DB- und App-Version |
| `appVersion` | Erzeugende App-Version, maximal 60 Zeichen |
| `exportedAt` | Validierter ISO-artiger Zeitpunkt |
| `includesPdf` | Boolean; bei `true` ist `pdfBase64` erforderlich |
| `document` | Vollständige Projektbeschreibung |
| `notes` | Höchstens ein Eintrag je Originalseite |
| `viewState` | Optional: `pageIndex`, `zoomMode`, `zoom` |
| `pdfBase64` | Nur beim vollständigen Backup erlaubt |

`document` enthält `id`, `pdfSha256`, `originalFilename`, `displayName`, `fileSize`, `pageCount`, `createdAt`, `updatedAt`, `lastOpenedAt`. Namen sind maximal 500 Zeichen, IDs maximal 128 Zeichen. Der Hash besteht aus genau 64 kleinen Hex-Zeichen. Die Originalgröße liegt zwischen 1 Byte und 150 MiB, die Seitenanzahl zwischen 1 und 5.000. Zeitangaben der Projektdaten sind nichtnegative sichere Ganzzahlen in Millisekunden.

Jede Notiz enthält `pageIndex`, `delta`, `isBookmarked`, `revision`, `updatedAt`. Dokument-ID und abgeleiteter Klartext werden nicht redundant exportiert. Seitenindizes sind nullbasiert und müssen zur PDF-Seitenanzahl passen. Revisionen sind nichtnegative sichere Ganzzahlen unter `Number.MAX_SAFE_INTEGER`; Restore erzeugt neue Projekt-ID und initiale gespeicherte Revisionen. Ein Lesezeichen allein ist kein sichtbarer Notiztext.

## Delta-Vertrauensgrenze

Nur `ops` mit `insert: string` und optionalen erlaubten `attributes` sind gültige vollständige Dokumente. Abschließender Zeilenumbruch ist Pflicht. `retain`, `delete`, Embeds, HTML, Links, Bilder und unbekannte Attribute werden abgewiesen.

Erlaubte Inline-Attribute: `bold`, `italic`, `underline`, `strike` jeweils als `true`, `color` und `background` als `#rrggbb`. Blockattribute: `header` 1–3, `list` `ordered`/`bullet`, `indent` 1–4, `align` `center`/`right`/`justify`; normal/links wird durch fehlendes Attribut repräsentiert. Blockattribute sind ausschließlich auf Newline-Operationen erlaubt. Header und Liste gleichzeitig sind ungültig. Ungesetzte Formatwerte im Editor werden vor der strengen Validierung normalisiert, Fremdbackups dagegen nicht still repariert.

Obergrenzen: 50.000 Operationen und 500.000 Zeichen je Seite, 10.000.000 Zeichen pro Projekt, 280 MiB Backup-Datei. Das Gesamtlimit berücksichtigt sämtliche Notizeinträge. UTF-16-Zeichenanzahl ist keine Byte- oder Glyphenzählung; das Datei-Bytelimit wird zusätzlich beim Import geprüft. Schriftglyphen werden erst beim PDF-Export gegen die tatsächlich gebündelten Fonts geprüft, nicht gegen den JSON-Zeichenvorrat.

`__proto__`, `constructor` und `prototype` werden bereits beim JSON-Parsing verworfen; Objekte werden streng geprüft und neu aufgebaut, nicht unsicher in Prototypen gemischt. Base64 muss eine gültige Form und die erwartete dekodierte Länge besitzen. Zusätzlich folgen echte PDF-Parser-Prüfung, Verschlüsselungsprüfung, SHA-256-, Größen- und Seitenzahlabgleich.

## Wiederherstellung

Bei `includesPdf=false` wird ein vorhandenes passendes Asset verwendet oder das identische Original angefordert. Gleicher Dateiname oder gleiche Seitenzahl reicht nicht. Ein falscher Hash kann nicht überstimmt werden. Bei einem vollständigen Backup werden die eingebetteten Originalbytes unabhängig geprüft.

Vor dem Commit erscheint eine Vorschau mit Projektname, Sicherungszeit, Notizseitenzahl, Typ und vorhandenen passenden Arbeitsständen. Standard und einzige angebotene Importart dieser Fassung ist eine neue Projektkopie. Kein stilles Mischen, kein In-place-Ersetzen, kein Risiko für einen vorhandenen Stand durch ein kaputtes Backup. Speicherfehler rollen die ganze Transaktion zurück.

Unbekannte zukünftige Versionen werden abgewiesen. Es wird keine unimplementierte Migration älterer Backupversionen behauptet. Ein PDF-Export enthält nicht das editierbare Delta-Projekt. Die JSON-Datei enthält unverschlüsselte Nutzerdaten und wird nach dem Download nicht automatisch aktualisiert.
