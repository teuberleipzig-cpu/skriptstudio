# MASTERPROMPT — SkriptStudio

**Auftrag:** Entwicklung einer lokalen PDF-Lernumgebung mit folienbezogenen Rich-Text-Notizen, verlässlicher Browser-Speicherung, PDF-Export und portablen Backups.

**Arbeitsname:** SkriptStudio. **Vorgeschlagenes neues Repository:** `teuberleipzig-cpu/skriptstudio`. Der Name ist eine Projektentscheidung, kein bereits existierendes oder freigegebenes Repository.

---

## 1. Rolle, Ergebnis und Arbeitsweise

Du bist mein verantwortlicher Senior Frontend Engineer, Softwarearchitekt, UI/UX Designer und QA Engineer. Plane, implementiere, überprüfe und dokumentiere eine vollständige, lauffähige WebApp. Arbeite über den verfügbaren GitHub-Connector direkt an dem dafür freigegebenen Repository. Du sollst die eigentliche Programmierarbeit übernehmen und mich nicht regelmäßig zum Kopieren einzelner Codeblöcke auffordern.

Ich möchte ein zuverlässiges Arbeitswerkzeug für mein Studium, keinen klickbaren Design-Dummy, keine Sammlung unverbundener Snippets und keine Oberfläche mit funktionslosen Buttons. Die Anwendung soll im Browser ohne Backend funktionieren und als statischer Build auf GitHub Pages laufen.

Erkläre vor der Implementierung knapp die Architekturentscheidungen und zeige die Projektstruktur. Anschließend implementiere tatsächlich. Triff normale technische Detailentscheidungen selbstständig und dokumentiere sie. Frage nur nach Informationen oder Berechtigungen, die weder aus dem Repository noch aus verfügbaren Werkzeugen sicher ermittelt werden können. Fehlende Connector-Berechtigungen sind kein Anlass, die unabhängig davon mögliche lokale Arbeit einzustellen.

Arbeite nachvollziehbar in kleinen, überprüfbaren Schritten. Unterscheide jederzeit zwischen geplant, lokal implementiert, getestet, auf GitHub geschrieben, gemergt und veröffentlicht. Behaupte keine erfolgreichen Tests oder Deployments ohne beobachtetes Ergebnis. Versprich keine unbeaufsichtigte Weiterarbeit nach Ende einer Antwort.

Die Prioritäten lauten: Datenintegrität vor Zuverlässigkeit der Kernfunktionen, Zuverlässigkeit vor Funktionsumfang, danach flüssige Bedienung und visuelle Qualität. Keine zusätzliche Funktion darf die Speicherung oder Zuordnung von Notizen gefährden.

## 2. Produktziel und Nutzungskontext

Ich öffne ein Vorlesungsskript als PDF. Links sehe ich die aktuelle Originalseite. Rechts schreibe ich formatierte Notizen genau zu dieser Seite. Beim Blättern wechselt die Notizzuordnung automatisch mit. Bereits geschriebene Inhalte bleiben erhalten. Nach einem normalen Neuladen oder späteren Öffnen im selben Browserprofil stelle die App das letzte Dokument, seine Notizen und den Arbeitsstand wieder her.

Am Ende exportiere ich entweder ein neues PDF mit eingefügten Notizseiten oder ein bearbeitbares Projektbackup. Das Original-PDF auf meinem Computer wird niemals überschrieben.

Die Oberfläche und alle Fehlermeldungen sind deutschsprachig. Der Code darf englische Bezeichner verwenden. Primäre Zielgeräte sind Windows-Desktop, Windows-Laptop und MacBook. Die App soll außerdem auf Tablets und Smartphones sinnvoll bedienbar bleiben. Achte besonders auf eine gute Nutzung auf einem Laptop während einer Vorlesung oder Zugfahrt.

Verwende „PDF öffnen“ statt eines irreführenden „In die Cloud hochladen“. Verdeutliche: Die Datei wird lokal eingelesen. GitHub Pages liefert den Anwendungscode aus; meine PDFs und Notizen werden nicht an GitHub oder einen anderen Dienst übertragen.

„Synchronisierung“ bezeichnet in dieser Version ausschließlich die Bindung zwischen PDF-Seite und Notiz. Implementiere keine angebliche automatische geräteübergreifende Synchronisierung. Browserdaten auf meinem PC und meinem Mac sind getrennte Arbeitsstände. Der Gerätewechsel erfolgt bewusst über Export und Import eines Backups.

## 3. Verbindlicher Funktionsumfang und drei Ergänzungen

Zum Kernumfang gehören PDF-Import und Wiederherstellung, Zwei-Spalten-Arbeitsbereich, Navigation und Zoom, vollständige unten beschriebene Textformatierung, eindeutige Seitenbindung, Auto-Save, brauchbare Fehlerbehandlung, paginierter PDF-Export, JSON-Backup mit Import und ein GitHub-Pages-fähiger Build samt Tests.

Ergänze darauf aufbauend genau drei sinnvolle Funktionsgruppen:

1. **Lokale Dokumentbibliothek:** mehrere Skripte, zuletzt verwendete Dokumente, Wiedererkennung desselben PDFs und ein eigener Arbeitsstand pro Dokument.
2. **Lernnavigation:** Kennzeichnung von Seiten mit Notizen, Lesezeichen sowie eine einfache Suche in den Notizen des aktuellen Dokuments.
3. **Offline-Nutzung:** eine installierbare PWA, die nach erfolgreicher Offline-Vorbereitung ohne Internet lesen, bearbeiten, speichern, exportieren und Backups importieren kann.

Baue zuerst den vollständigen Kernablauf. Ergänze diese drei Gruppen danach mit eigenen Tests. Scheitert eine Ergänzung an einer konkreten technischen Grenze, liefere den funktionierenden Kern, benenne die Grenze präzise und kennzeichne die Ergänzung als offen statt als erledigt.

Nicht Bestandteil der ersten Version sind Benutzerkonten, Echtzeit-Kollaboration, Serverdatenbanken, KI-Zusammenfassungen, OCR, Handschrifterkennung, direkte Bearbeitung des Original-PDFs, Audioaufnahmen, kostenpflichtige APIs oder eine vollständige Microsoft-Word-Nachbildung. Bilder, Tabellen, eingebettete Videos und ein Formeleditor im Notizbereich sind ebenfalls nicht erforderlich. Die in Abschnitt 8 genannten Formatierungen sind dagegen Pflicht.

## 4. Tech-Stack und Abhängigkeiten

Verwende **Vite, React und TypeScript im Strict Mode**. Entwickle eine statische Single-Page-App ohne SSR und ohne Laufzeit-Backend. Ein Node.js-basierter Build auf dem Entwicklungsrechner oder in GitHub Actions ist erlaubt; zur späteren Benutzung benötigt die App keinen Node-Server.

Verwende **pdf.js über `pdfjs-dist`** für die PDF-Darstellung. Binde den passenden Worker mit dem Build ein. PDF.js und Worker müssen aus derselben installierten Paketversion stammen.

Verwende **Quill** mit direkter, sauber gekapselter React-Integration. Verlasse dich nicht auf einen veralteten React-Wrapper. Speichere den vollständigen Quill-Delta-Dokumentzustand als kanonisches Notizformat. HTML ist weder Primärspeicher noch Import-Vertrauensgrenze.

Verwende **IndexedDB über Dexie** für Original-PDFs, Dokumentmetadaten, Notizen und Arbeitsstände. LocalStorage darf höchstens kleine unkritische UI-Einstellungen enthalten. Speichere große PDFs nicht als Base64 in LocalStorage.

Verwende **pdfmake** zur Erstellung formatierter, automatisch umbrechender Notizseiten mit echtem PDF-Text und **pdf-lib** zum Kopieren und Zusammenführen der Original- und Notizseiten. Entwickle einen expliziten, getesteten Konverter vom erlaubten Quill-Delta-Format in das pdfmake-Dokumentmodell. Verwende keinen generischen HTML-Screenshot als primären Exportweg.

Verwende **Zod oder eine gleichwertige kleine Schema-Validierung** für Backup-Importe und persistierte Fremddaten, **Vitest** für Unit-/Integrationstests und **Playwright** für Browser- und End-to-End-Tests. Verwende bei Bedarf `fake-indexeddb` für isolierte Datenbanktests. Teste zeitkritische Speicherabläufe zusätzlich in einem echten Browser.

Für das UI genügen selbst geschriebene CSS-Module oder klar gegliederte Stylesheets mit Design-Tokens und geeignete lokal gebündelte Icons. Ein Shadcn-artiger Stil ist das visuelle Ziel, keine Verpflichtung zu einem großen Komponentenframework. Kein Tailwind-Play-CDN und keine externen UI-, Schrift- oder Editor-CDNs zur Laufzeit.

Wähle zum Implementierungszeitpunkt tatsächlich verfügbare, stabile und kompatible Paketversionen. Prüfe offizielle Dokumentation und relevante Sicherheitsmeldungen. Committe ein echtes Lockfile. Vermeide unkontrollierte `latest`-Abhängigkeiten, nicht reproduzierbare Installationen und erfundene Versionsnummern. Stelle sicher, dass Quill-, pdfmake- und PDF.js-APIs zur jeweils verwendeten Version passen. Keine Vermischung alter und neuer API-Beispiele.

## 5. UI-Konzept und visuelles Design

Entwerfe eine ruhige, hochwertige Arbeitsoberfläche: helle neutrale Flächen, gut lesbare Typografie, dezente Umrandungen, eine zurückhaltende Akzentfarbe und klare Zustände. Der Arbeitsbereich ist wichtiger als eine dekorative Startseite. Keine unnötigen Animationen, riesigen Marketingüberschriften oder sich ständig öffnenden Dialoge.

Die obere App-Leiste enthält Produktname, Zugang zur Bibliothek, „PDF öffnen“, den aktuellen Dokumentnamen, den Speicherstatus und gut auffindbare Aktionen für Backup und PDF-Export. Lange Dateinamen werden optisch gekürzt, bleiben aber vollständig zugänglich.

Darunter befindet sich der Hauptbereich mit PDF links und Notizen rechts. Starte ungefähr bei einer 52:48-Aufteilung. Beide Bereiche haben eigene Scrollflächen. Die Trennlinie ist verschiebbar, besitzt sinnvolle Mindestbreiten und lässt sich auch per Tastatur bedienen. Speichere die Aufteilung als UI-Einstellung. Ein Zurücksetzen auf die Standardaufteilung muss möglich sein.

Der PDF-Bereich besitzt eine eigene kompakte Navigations- und Zoomleiste. Der Notizbereich zeigt stets deutlich „Notizen zu Seite X“ und eine sichtbare Formatierungsleiste. Es darf visuell niemals so aussehen, als gehöre eine Notiz zu einer anderen Seite als der angezeigten Folie. Wenn die neue Seite noch lädt, zeige einen passenden Ladezustand statt unbeschrifteten alten Inhalt.

Der Editor soll wie ein ordentliches Schreibblatt wirken, nicht wie ein kleines Kommentarformular. Die Toolbar bleibt beim Scrollen erreichbar. Kein automatischer Fokuswechsel zum Viewer nach jedem Speichern oder Rendern. Ein Hinweis auf leere Notizen darf nicht als echter Inhalt gespeichert oder exportiert werden.

Auf kleinen Displays verwende einen klaren Wechsel zwischen „PDF“ und „Notizen“, statt zwei unbrauchbar schmale Spalten zu erzwingen. Dokument, aktuelle Seite und Eingaben bleiben beim Wechsel erhalten. Auf mittleren Displaygrößen darf eine untereinander angeordnete Darstellung gewählt werden, sofern sie tatsächlich gut bedienbar ist.

Berücksichtige sichtbare Tastaturfokusse, ausreichend große Touch-Ziele, verständliche Beschriftungen, Screenreader-Namen, Kontraste und reduzierte Bewegung. Informationen dürfen nicht nur über Farben kommuniziert werden. Zeige Fehler dauerhaft genug, um sie verstehen und beheben zu können.

## 6. PDF-Import und Dokumentidentität

Unterstütze Dateiauswahl und Drag-and-drop. Prüfe Dateigröße und eine plausible PDF-Signatur; verlasse dich nicht allein auf die Dateiendung oder den MIME-Type. Führe anschließend eine echte PDF-Parser-Prüfung durch. Leere, beschädigte, unpassende oder nicht unterstützte Dateien müssen verständliche Meldungen auslösen.

Führe einen zweistufigen Import durch: erst prüfen und vorbereiten, dann den vollständigen Datensatz transaktional speichern und aktivieren. Ein fehlgeschlagener Import darf das bisher geöffnete Dokument nicht ersetzen oder dessen Notizen löschen.

Berechne einen SHA-256-Hash über die originalen Dateibytes. Nutze den Hash zur Inhaltsidentifikation und Duplikaterkennung. Der Dateiname ist keine verlässliche Identität. Zwei unterschiedliche PDFs mit demselben Namen dürfen niemals automatisch dieselben Notizen erhalten.

Trenne eine zufällig erzeugte stabile `documentId` des annotierten Projekts vom `pdfSha256` des zugrunde liegenden PDFs. Standardmäßig öffne bei erneutem Import derselben Bytes den vorhandenen Arbeitsstand. Erlaube eine zusätzliche unabhängige Notizkopie nur über eine ausdrückliche Aktion. Diese Kopie bekommt eine neue `documentId`, darf aber denselben unveränderlichen PDF-Blob referenzieren.

Halte die Originalbytes unverändert in IndexedDB vor. Bedenke bei TypedArrays und Worker-Transfers, dass ein an einen Worker übertragener Buffer im aufrufenden Kontext unbrauchbar werden kann. Viewer, Backup und Export dürfen sich nicht versehentlich denselben anschließend abgetrennten Buffer teilen.

Die erste Version unterstützt gewöhnliche, unverschlüsselte Vorlesungs-PDFs. Erkenne verschlüsselte oder passwortgeschützte PDFs vor dem dauerhaften Import und lehne sie mit einer Erklärung ab, solange die gesamte Verarbeitungskette einschließlich Export nicht nachweislich unterstützt wird. Aktiviere nicht einfach `ignoreEncryption`, um fehlende Unterstützung zu kaschieren. Behaupte keine Erhaltung digitaler Signaturen oder sämtlicher interaktiver Formularfunktionen.

Definiere Größenlimits zentral und kommuniziere sie vor dem Import. Ausgangspunkt: bis zu 150 MiB PDF-Dateigröße als technische Eingangsschranke, mit deutlichem Hinweis auf browser- und geräteabhängige Grenzen. Das ist keine Leistungszusage. Die Abnahme soll mindestens ein repräsentatives Skript mit etwa 300 Seiten beziehungsweise ein größeres bildlastiges Skript umfassen; protokolliere die tatsächlich getesteten Größen.

## 7. PDF-Viewer, Navigation und Rendering

Unterstütze vorherige und nächste Seite, direkte Seitenzahleingabe, „Seite X von Y“, Zoom vergrößern/verkleinern und „An Breite anpassen“. Verwende einen zentralen gültigen Seitenbereich. Ungültige Eingaben, Null, negative Werte und Werte oberhalb der Seitenanzahl müssen abgefangen werden. Interne Seitenindizes sind nullbasiert; sichtbare Seitenzahlen beginnen bei eins.

„An Breite anpassen“ reagiert auf Änderungen der Fenster- und Panelgröße. Behandle manuelle Zoomwerte und den Fit-Modus als getrennte Zustände, damit ein Resize einen bewusst gewählten Zoom nicht unerwartet überschreibt.

Rendere mit angemessener Berücksichtigung der Pixeldichte, aber begrenze Canvas-Pixelzahl und maximale Skalierung, um Speicherprobleme zu vermeiden. Unterstütze unterschiedliche Originalformate, gemischte Ausrichtungen, Rotation und relevante Seitenausschnitte. Erzwinge keine A4-Annahme für die Originalfolien.

Rendere nicht alle Seiten eines langen Dokuments gleichzeitig. Die aktuelle Seite hat Vorrang; ein begrenzter Cache für Nachbarseiten ist möglich. Miniaturansichten, sofern umgesetzt, werden nur bei Bedarf und niedrig aufgelöst erzeugt. Gib unbenötigte Ressourcen wieder frei.

Beende laufende Renderaufträge beim Seiten- oder Dokumentwechsel und verwende zusätzlich eine Generations-ID, damit verspätete Antworten nicht in den aktuellen Viewer schreiben. Cancellation allein reicht nicht als Zuordnungsmechanismus. Verhindere konkurrierendes Rendering auf demselben Canvas. Ein erwarteter Renderabbruch ist kein Nutzerfehler.

Binde einen zur installierten PDF.js-Version passenden Text-Layer ein, damit Text in textbasierten PDFs markiert und kopiert werden kann. Erwarte das nicht bei reinen Bildscans; implementiere keine heimliche OCR. Führe keine im PDF eingebetteten JavaScript-Aktionen aus und lade nicht ungefragt externe Inhalte aus einem PDF nach.

## 8. Rich-Text-Editor und erlaubte Formatierungen

Implementiere die folgenden Funktionen vollständig und mit sichtbarem aktivem beziehungsweise inaktivem Zustand:

- Fett, kursiv, unterstrichen und durchgestrichen, einschließlich Kombinationen.
- Standardabsatz sowie Überschriften H1, H2 und H3.
- Ungeordnete und nummerierte Listen, mit begrenztem Ein- und Ausrücken.
- Linksbündig, zentriert, rechtsbündig und Blocksatz.
- Schriftfarbe und Text-Hintergrundfarbe als Markierung.
- Rückgängig und Wiederholen über Toolbar und übliche Tastenkombinationen.
- Formatierung entfernen.

Speichere niemals nur die Änderungsoperationen des letzten `text-change`-Events als komplettes Dokument. Lese dafür den vollständigen Delta-Zustand aus dem Editor. Berücksichtige den abschließenden Zeilenumbruch und zeilenbezogene Attribute wie Überschriften, Listen und Ausrichtung.

Die Editorinstanz bleibt während gewöhnlicher Eingaben und Auto-Saves stabil. Keine Neuerstellung bei jedem Tastendruck. React Strict Mode darf keine doppelten Toolbars, Event-Listener oder Speicheraufrufe erzeugen. Räume Listener und Instanzen bei der tatsächlichen Freigabe kontrolliert auf.

Toolbar-Aktionen müssen auf die richtige Textauswahl wirken. Auswahlverlust durch einen Farbpicker oder einen Toolbar-Klick ist zu verhindern. Beachte gleichzeitig Tastaturbedienung und Screenreader; löse Fokusprobleme nicht ausschließlich über Mausereignisse.

Die Undo-Historie einer Seite darf niemals Inhalte einer anderen Seite verändern. Ladeaktionen dürfen nicht als Nutzereingaben in die gemeinsame Undo-Historie gelangen. Verwende getrennte Editorkontexte oder setze die Historie bei einem echten Seitenwechsel kontrolliert zurück. Eine auf die aktuelle Seitenbearbeitung begrenzte Undo-Historie ist für Version 1 zulässig, muss aber in der Hilfe transparent beschrieben werden. Persistiere keine undokumentierten internen Quill-History-Strukturen.

Kopieren und Einfügen aus anderen Anwendungen soll die erlaubten Formatierungen so weit wie sinnvoll übernehmen. Nicht unterstützte Elemente werden sicher zu Text reduziert oder mit verständlichem Hinweis abgelehnt. Externe Bilder, Videos, Scripts, Event-Handler und beliebige HTML-Strukturen gehören nicht in das erlaubte Notizmodell. Clipboard-Inhalte sind nicht automatisch vertrauenswürdig.

## 9. Verlässliche Bindung von PDF-Seite und Notiz

Die Zuordnung erfolgt ausschließlich über den stabilen Schlüssel `[documentId, pageIndex]`. Ein später ausgeführter Save darf niemals erst dann die gerade aktuelle Seitenzahl aus einem veränderlichen globalen Zustand lesen.

Bei jeder Editoränderung erfasse den vollständigen Inhalt mit dem zugehörigen Dokument, der Seite und einer monotonen lokalen Revision als unveränderlichen Snapshot. Aktualisiere den In-Memory-Arbeitsstand unmittelbar und reihe den Snapshot unter seinem ursprünglichen Schlüssel in die Speicherverwaltung ein.

Beim Wechsel von Seite A nach B sichere den aktuellen Snapshot von A und stoße das sofortige Schreiben der offenen Änderungen an. Lade anschließend ausschließlich den Zustand von B. Neuere, noch nicht geschriebene In-Memory-Inhalte haben Vorrang vor einem älteren Datenbankstand. Spät eintreffende Ladeergebnisse für A dürfen den Editor von B nicht überschreiben.

Trenne „Notiz wird geladen“, „Notiz ist tatsächlich leer“ und „Notiz konnte nicht geladen werden“. Ein vorübergehend leerer Editor während der Initialisierung darf keinen bestehenden Datensatz überschreiben. Programmgesteuertes Setzen des Inhalts muss vom nutzerbedingten Ändern unterscheidbar sein.

Teste ausdrücklich: Tippen auf A, sofort B öffnen, dort tippen, sofort C öffnen und zu A zurückkehren. Teste diesen Ablauf zusätzlich mit künstlich verzögerten Lese- und Schreiboperationen. Die letzte aktive Seite, sichtbare Folie, Editorüberschrift und editierbare Notiz müssen am Ende übereinstimmen.

## 10. Datenmodell und Speicherorganisation

Verwende mindestens die folgenden logisch getrennten Datenbereiche. Definiere die tatsächlichen TypeScript-Typen und Dexie-Indizes im Code vollständig.

**Documents:** `id`, `pdfSha256`, `originalFilename`, `displayName`, `fileSize`, `pageCount`, `createdAt`, `updatedAt`, `lastOpenedAt`. Eine `id` bezeichnet ein annotiertes Projekt, nicht notwendigerweise die einzige Kopie eines PDFs.

**PdfAssets:** `sha256`, unveränderlicher `blob`, `byteLength`, `createdAt`. Notizänderungen dürfen diesen großen Blob nicht erneut schreiben. Wird ein Dokument gelöscht, entferne ein gemeinsam genutztes PDF nur, wenn kein weiteres Projekt darauf verweist.

**Notes:** `documentId`, `pageIndex`, vollständiger `delta`, abgeleiteter `plainText`, `isBookmarked`, `updatedAt` und `revision`. Der zusammengesetzte Dokument-/Seitenschlüssel ist eindeutig. Eine leere Notiz und ein Lesezeichen sind getrennte Sachverhalte.

**Sessions und Settings:** letzte Dokument-ID, letzte Seite pro Dokument, Zoommodus, Zoomwert, Split-Verhältnis und gegebenenfalls passende Scrollpositionen. Die aktuell aktive Seite ist kein globaler, von allen Dokumenten geteilter Datensatz ohne Dokumentbezug.

**Recovery beziehungsweise Conflicts:** begrenzte, ausdrückliche Wiederherstellungskopien bei erkannten Konflikten oder vor destruktivem Import. Keine unbegrenzte Vollversion jeder Notiz nach jedem Tastendruck.

Versionsnummeriere das Datenbankschema und das Backupformat unabhängig voneinander. Migrationen müssen vorhandene Daten erhalten. Niemals bei einem Upgrade vorsorglich die gesamte Datenbank löschen. Behandle blockierte Upgrades durch weitere offene Tabs und einen unerwarteten Datenbankfehler mit einer verständlichen Wiederherstellungsstrategie.

Nutze einen projektspezifischen Datenbanknamen und projektspezifische Cache-Namen. Lösche niemals fremde LocalStorage-Schlüssel, Datenbanken oder Caches desselben Origins.

## 11. Auto-Save, Schreibreihenfolge und Statusanzeige

Speichere debounced nach ungefähr 350 Millisekunden Schreibpause. Ergänze ein maximales Wartefenster, beispielsweise 1.500 Millisekunden, damit auch beim ununterbrochenen Schreiben regelmäßig Datenbankstände entstehen. Die Werte sind zentral konfigurierbare Produktentscheidungen, keine unveränderlichen Naturkonstanten.

Verwende pro Notizschlüssel eine geordnete Schreibverwaltung mit Revisionen. Ältere Snapshots dürfen neuere Daten nicht überschreiben. Eine Warteschlange muss einen fehlgeschlagenen Schreibvorgang verarbeiten und später wieder arbeitsfähig sein; eine einmal abgelehnte Promise darf nicht alle zukünftigen Saves dauerhaft blockieren.

Eine Notiz gilt erst dann als gespeichert, wenn die relevante IndexedDB-Transaktion erfolgreich abgeschlossen ist. Die Anzeige „Alle Änderungen gespeichert“ ist nur erlaubt, wenn es für den gesamten aktuellen Arbeitsstand keine neueren Dirty-Revisionen und keine offenen Schreibvorgänge gibt.

Zeige mindestens „Wird geladen“, „Ungespeicherte Änderungen“, „Speichert …“, „Gespeichert um HH:MM“ und „Speichern fehlgeschlagen“. Ein Erfolg für Revision 12 darf nicht als vollständiger Erfolg erscheinen, während Revision 13 noch ungespeichert ist. Fehler benötigen konkrete Aktionen wie „Erneut versuchen“ und „Notfall-Backup herunterladen“.

Flush-Auslöser sind Seitenwechsel, Dokumentwechsel, Export, Backup und sinnvolle Lebenszyklusereignisse wie `visibilitychange` oder `pagehide`. Verlasse dich nicht darauf, beim Schließen des Browsers noch lange asynchrone Datenbankoperationen fertigzustellen. Ein bedingter `beforeunload`-Hinweis bei offenen Änderungen darf nur zusätzliche Absicherung sein.

Bei Schreibfehlern bleibt der aktuelle Inhalt im Arbeitsspeicher erhalten. Ein Notfall-Backup muss auch dann möglich sein, wenn IndexedDB gerade nicht beschreibbar ist. Es muss die letzten In-Memory-Notizen enthalten und darf nicht nur einen veralteten Datenbankstand exportieren.

Kommuniziere realistisch: Ein abrupter Prozessabbruch kann noch nicht bestätigte Eingaben verlieren. Browserdaten können gelöscht werden, und Privatmodus kann ihre Lebensdauer begrenzen. Kein falsches „100 % verlustsicher“. Frage geeignete Browser über die Storage API nach persistentem Speicher, erläutere das Ergebnis und biete Backups unabhängig davon an. Speicherverbrauch und verfügbare Quote sind nur Schätzwerte; blockiere einen Import nicht allein wegen eines ungenauen Schätzwerts.

## 12. Mehrere Tabs und konkurrierende Änderungen

Verhindere stilles Überschreiben, wenn dieselbe App in mehreren Tabs geöffnet ist. Eine einfache, zuverlässige Strategie ist ein exklusiver Schreibzugriff pro Dokument: Der zweite Tab darf lesen, erhält aber einen klaren Hinweis, dass das Dokument bereits anderswo bearbeitet wird.

Verwende verfügbare Web-Locks und Benachrichtigungen beispielsweise per BroadcastChannel nach Feature-Detection. Eine Broadcast-Nachricht allein ist keine atomare Sperre. Ergänze transaktionale Revisionsprüfungen vor dem Schreiben, damit auch auf Browsern ohne diese Komfortschnittstellen keine stillen Last-write-wins-Verluste entstehen.

Wird ein Konflikt erkannt, bewahre beide Inhalte, stoppe den riskanten Schreibpfad und ermögliche eine bewusste Auflösung oder einen Export. Ein Übernehmen des Schreibzugriffs darf nicht verdeckt noch ungespeicherte Inhalte eines anderen Tabs zerstören. Importieren, Löschen und Backup-Wiederherstellen müssen dieselben Konfliktregeln respektieren.

Teste zwei Tabs, einen geschlossenen Schreib-Tab, einen pausierten beziehungsweise verzögerten Tab und konkurrierende Notizänderungen. Die Strategie darf einfach sein; Datenverlust darf sie nicht verschweigen.

## 13. PDF-Export: verbindliches Ausgabeformat

Der Pflichtmodus heißt „Originalseiten mit Notizen“. Übernimm alle Originalseiten in unveränderter Reihenfolge. Füge unmittelbar nach jeder Originalseite die zugehörigen Notizseiten ein. Lange Notizen dürfen mehrere Seiten beanspruchen. Die nächste Originalfolie folgt erst nach allen Notizseiten der vorherigen Folie.

Verwende A4-Hochformat für neue Notizseiten mit gut lesbarer Standardschrift, sinnvollen Rändern, wiederkehrender Zuordnung zur Originalseite und einer dezenten Fußzeile. Die Originalseiten behalten ihr eigenes Format, ihre Orientierung und den relevanten visuellen Seiteninhalt. Das resultierende PDF darf deshalb gemischte Seitenformate besitzen.

Biete die sichtbare Option „Leere Notizseiten auslassen“ an; sie darf standardmäßig aktiviert sein. Ist sie deaktiviert, erzeuge nach jeder Originalseite mindestens eine Notizseite, auch ohne Notiztext. Definiere „leer“ über tatsächlichen sichtbaren Inhalt, nicht über das bloße Vorhandensein eines Delta-Objekts. Lesezeichen allein erzeugen keine Textnotiz.

Der Referenzfall lautet: Originalseite 1, eine Notizseite zu 1, Originalseite 2, drei Notizseiten zu 2, Originalseite 3 ohne Notiz. Bei aktivierter Leer-Auslassung muss die Reihenfolge exakt diese sieben Seiten enthalten. Teste zusätzlich den Modus mit leeren Notizseiten.

Kopiere Originalseiten über pdf-lib, statt sie aus dem Viewer-Canvas in das neue PDF zu fotografieren. Die gespeicherten Originalbytes bleiben unverändert. Versprich beim neu erzeugten Gesamtdokument dennoch keine byteidentische Datei, Erhaltung digitaler Signaturen, aller Formularfunktionen, dokumentweiten Bookmarks oder beliebiger aktiver PDF-Funktionen. Der v1-Schwerpunkt sind gewöhnliche Vorlesungsfolien.

Ein zusätzliches kombiniertes A4-Layout mit Folie und Notizen nebeneinander oder untereinander ist eine spätere Erweiterung. Es ist kein Ersatz für einen fehlerfreien Pflichtmodus und soll Version 1 nicht unnötig verkomplizieren.

## 14. PDF-Export: Textlayout und Verarbeitung

Erzeuge Notiztext als echten, auswählbaren PDF-Text. Schreibe einen getesteten Delta-Konverter, der Inline- und Blockformatierungen korrekt unterscheidet. Behandle Newline-Attribute, Absätze, aufeinanderfolgende Listen, verschachtelte Listen, Überschriften und gemischte Zeichenformatierung explizit.

Alle Pflichtformatierungen aus der Toolbar müssen auch im Export sichtbar sein. Unterstreichen und Durchstreichen dürfen bei Kombination nicht gegenseitig verschwinden. Schriftfarbe, Markerfarbe, Blocksatz und Listennummerierung dürfen nicht stillschweigend verloren gehen.

Die Layout-Engine muss lange Absätze und Listen auf mehrere Seiten umbrechen. Keine feste Begrenzung auf eine Notizseite, keine abgeschnittenen Inhalte, keine auf winzige Schrift verkleinerten Gesamtnotizen und kein riesiges, anschließend beliebig zerschnittenes Canvas-Bild. Überschriften sollen nach Möglichkeit mit dem folgenden Absatz zusammenbleiben; überlange Inhalte müssen trotzdem umbrechen können.

Prüfe Umlaute, ß, typografische Anführungszeichen und im Studium übliche Zeichen wie α, β, μ, σ, Δ, ≤, ≥, ±, ² und →. Verwende dafür geeignete, korrekt lizenzierte Schriftressourcen aus den Projektabhängigkeiten oder einem bewusst hinzugefügten offenen Paket. Verwende keine privaten Systemschriftdateien aus der Ausführungsumgebung. Behaupte keine Unterstützung jedes Unicode- oder Emoji-Zeichens. Nicht abgedeckte Zeichen müssen erkennbar gemeldet statt kommentarlos entfernt werden.

Binde alle benötigten Fonts lokal mit ein und berücksichtige sie im Offline-Build. Browserdarstellung und PDF dürfen sich in Zeilenumbrüchen leicht unterscheiden; eine exakte Word-artige Druck-WYSIWYG-Garantie ist nicht erforderlich. Inhalt, Zuordnung und unterstützte Formatierungen müssen erhalten bleiben.

Erfasse beim Start einen konsistenten Export-Snapshot einschließlich aktueller In-Memory-Notizen. Spätere Eingaben dürfen nicht zufällig in die Hälfte eines bereits laufenden Exports einfließen. Sichere offene Änderungen zuerst bestmöglich; ein Speicherfehler darf einen ausdrücklich angebotenen Rettungsexport aus dem Arbeitsspeicher nicht verhindern.

Zeige nachvollziehbaren Fortschritt anhand tatsächlich verarbeiteter Seiten, verhindere doppelte Exporte und ermögliche Abbruch zwischen geeigneten Verarbeitungsschritten. Behaupte keine sofortige Unterbrechbarkeit eines nicht abbrechbaren Library-Aufrufs. Nutze bei messbar langer CPU-Arbeit einen Worker, soweit mit der gewählten Exportkette zuverlässig möglich, oder teile die Verarbeitung in begrenzte Schritte. Nach einem Abbruch darf kein angeblich vollständiges PDF heruntergeladen werden.

Verarbeite Dokumente speicherschonend, gib Zwischenobjekte frei und vermeide unnötige vollständige Kopien großer Blobs. Erzeuge eine neue Datei mit einem sicheren, sinnvollen Namen wie `Skriptname_mit_Notizen_YYYY-MM-DD.pdf`. Der Download erhält niemals den unveränderten Originalnamen ohne erkennbaren Zusatz.

## 15. JSON-Backups und Gerätewechsel

Implementiere zwei ausdrücklich unterscheidbare Exportvarianten für das aktuelle annotierte Projekt:

**Notizen-Backup:** eine JSON-Datei mit Dokumentbeschreibung, SHA-256 des Original-PDFs, Seitenanzahl, vollständigen Delta-Notizen, Lesezeichen und optionalem Arbeitsstand, aber ohne PDF-Bytes. Dieses Backup benötigt beim Wiederherstellen das identische Original-PDF oder ein bereits vorhandenes passendes PDF-Asset.

**Vollständiges Projektbackup:** eine JSON-Datei mit denselben Informationen und dem vollständigen Original-PDF als Base64. Damit kann das Projekt in einem frischen Browserprofil oder auf einem anderen Gerät ohne zusätzliche Quelldatei wiederhergestellt werden. Weise auf die größere Datei und den höheren Arbeitsspeicherbedarf hin.

Das Format enthält mindestens `format`, `schemaVersion`, `appVersion`, `exportedAt`, `includesPdf`, `document`, `notes` und optional `viewState` sowie `pdfBase64`. Definiere das exakte Schema im Code und dokumentiere es. `schemaVersion` des Backupformats ist unabhängig von Datenbankversion und App-Version.

Importiere niemals ungeprüft eine beliebige JSON-Struktur in den Editor. Prüfe Formatkennung, unterstützte Version, Datentypen, Seitenbereich, Anzahl der Einträge, Gesamttextmenge, erlaubte Attribute, zulässige Farbwerte und Größenlimits. Vollständige gespeicherte Deltas dürfen nur die erlaubten Inhaltsoperationen enthalten, keine beliebigen Änderungsoperationen oder unbekannten Embeds.

Verhindere Prototype-Pollution und gefährliche unvalidierte Objektzusammenführungen. Verhindere ebenso HTML-/Script-Injektionen und externe Ressourcen durch importierte Notizen. Fehlerhafte Backups verändern keine bestehenden Daten.

Bei einem vollständigen Backup prüfe vor dem Commit die dekodierten PDF-Bytes, deren Hash und Seitenanzahl. Bei einem Notizen-Backup vergleiche das vorhandene beziehungsweise vom Nutzer gewählte Original über den Hash. Dateiname und Seitenanzahl allein reichen nicht zur Zuordnung. Ein anderer Hash darf nicht automatisch überstimmt werden.

Zeige vor einem verändernden Import eine kurze Vorschau: Dokumentname, Sicherungszeitpunkt, Anzahl der notierten Seiten, vollständiges oder reines Notizen-Backup und mögliche Konflikte. Standardmäßig importiere als eigenständige Wiederherstellungskopie mit neuer `documentId`. Ein bewusstes Ersetzen eines bestehenden Arbeitsstands benötigt eine ausdrückliche Bestätigung und eine Sicherung des vorherigen Zustands. Keine stillen Überschreibungen und keine unklaren Mischungen alter und neuer Notizen.

Importiere den geprüften Zustand atomar. Bei zu wenig Speicher oder einem anderen Fehler rolle vollständig zurück. Nicht unterstützte zukünftige Versionen werden verständlich abgelehnt. Eine alte Version wird nur durch eine tatsächlich implementierte und getestete Migration unterstützt.

Ein PDF-Export ist kein bearbeitbares Projektbackup. Erkläre diesen Unterschied in der Oberfläche. Ein heruntergeladenes Backup kann die App nicht automatisch auf meinem Dateisystem aktualisieren; behauptete Hintergrund-Synchronisierung ohne Dateizugriff ist unzulässig.

## 16. Dokumentbibliothek und Lernnavigation

Die Bibliothek zeigt lokal gespeicherte Projekte mit Name, Originalseitenzahl, Zeitpunkt der letzten Bearbeitung und Anzahl der Seiten mit Notizen. Sie öffnet ein Projekt an der zuletzt verwendeten Stelle. Ein umbenannter Anzeigename verändert weder Originaldatei noch Hash noch Notizzuordnung.

Ermögliche das bewusste Löschen eines Projekts mit Warnung und Backup-Hinweis. Lösche zugehörige Notizen und Sitzungsdaten transaktional; gemeinsam referenzierte PDF-Assets bleiben erhalten. Verzichte auf einen globalen „Alles löschen“-Knopf direkt neben häufig benutzten Aktionen.

Die Seitenübersicht kennzeichnet aktuelle Seite, vorhandene Notizen und Lesezeichen unterscheidbar. Sie bleibt bei großen PDFs bedienbar. Eine einfache nummerierte Liste ist besser als hunderte eager gerenderte Vorschaubilder.

Die Notizensuche durchsucht die Notizen des aktuellen Projekts ohne Beachtung der Groß-/Kleinschreibung. Treffer zeigen Seitenzahl und kurzen Textausschnitt. Ein Treffer öffnet die zugehörige PDF-Seite und Notiz. Die Suche durchsucht nicht automatisch gescannte Folieninhalte; kennzeichne ihren tatsächlichen Geltungsbereich.

Leite Klartext und „hat Notiz“-Status konsistent aus dem validierten Delta ab. Verhindere, dass ein leerer Absatz, eine leere Liste oder ein bloßes Lesezeichen als inhaltlich ausgefüllte Notiz gezählt wird.

## 17. Tastaturbedienung und Fokusregeln

Unterstütze Alt + Pfeil links/rechts für den Seitenwechsel. Beachte dabei browser- und betriebssystemspezifische Konflikte; teste die gewählte Kombination. Normale Pfeiltasten dürfen nur dann für Foliennavigation verwendet werden, wenn kein Editor, Eingabefeld, Auswahlfeld oder Dialog diese Tasten benötigt.

Im Editor müssen Cursorbewegung, Wortnavigation, Textauswahl und IME-Komposition normal funktionieren. Alt-basierte Wortnavigation auf dem Mac darf nicht ohne bewusste Alternative unbrauchbar werden. Bei Konflikten verwende im Editor eine dokumentierte zusätzliche Kombination oder beschränke den globalen Alt-Shortcut auf den Viewer; erhalte die schnelle Navigation über die Toolbar.

Unterstütze Strg/Cmd + B, I und U sowie die üblichen Undo-/Redo-Kombinationen. Strg/Cmd + S soll offene Notizen speichern beziehungsweise flushen und nicht den Browserdialog zum Speichern der HTML-Seite öffnen. Dialoge lassen sich mit Escape schließen, soweit keine zwingende Entscheidung offen ist.

Zeige Shortcuts in einer kleinen Hilfe und als geeignete Tooltips. Abfangen von Tastaturereignissen muss kontextabhängig sein. Keine globale Eventbehandlung, die normales Schreiben, Browserfunktionen oder assistive Technik unnötig beeinträchtigt.

## 18. Offline-PWA und sichere Updates

Ergänze Web-App-Manifest und Service Worker mit zum Repository-Unterpfad passenden URLs und Scope. Die PWA muss nach erfolgreicher Vorbereitung offline neu geöffnet werden können. Nur bereits geöffnete Tabs bei bestehender Internetunterbrechung zu unterstützen, genügt nicht.

Bündele und cache sämtliche für den Pflichtumfang nötigen Ressourcen: App-Shell, CSS, Editor, PDF-Worker, gegebenenfalls PDF.js-CMaps/WASM/Standardfonts, Exportmodule und PDF-Fontressourcen. Beachte Lazy Loading: Ein Modul, das vor dem Offline-Wechsel nie geladen und nicht vorbereitet wurde, ist offline nicht verfügbar. Teste besonders den allerersten PDF-Export nach dem Offline-Wechsel.

Zeige „Offline bereit“ erst, wenn die dafür nötige Installation und Ressourcenbereitstellung tatsächlich abgeschlossen sind. Bei fehlgeschlagener Vorbereitung darf keine falsche Bereitschaft angezeigt werden. Neue Browserprofile ohne vorherige Online-Vorbereitung sind offline nicht startfähig; dokumentiere diese Grenze.

Meine Dokumentdaten gehören in IndexedDB, nicht in GitHub, Service-Worker-Quelltext oder vorgefertigte App-Caches. Caching von Programmdateien und dauerhafte Speicherung von Nutzerdaten sind getrennte Aufgaben.

Ein App-Update darf den Tab nicht während des Schreibens ungefragt neu laden. Melde eine neue Version, sichere offene Änderungen und aktiviere sie erst kontrolliert. Berücksichtige mehrere Tabs und Datenbankschemaänderungen. Ein Cache-Cleanup entfernt ausschließlich veraltete Caches dieser App.

Funktioniert eine benötigte PWA-Schnittstelle im verwendeten Browser nicht, bleibt die App online benutzbar und erläutert die eingeschränkte Offline-Funktion. Verlange keine kostenpflichtigen Dienste oder zusätzliche Browser-Erweiterungen.

## 19. Datenschutz, Sicherheit und Grenzen des Hostings

Implementiere keine Analyse-SDKs, Werbung, Tracking-Pixel oder externen Dokumentdienste. Die Anwendung muss ihre Kernaufgaben ohne ausgehende Übertragung von PDFs, Dateiinhalten oder Notizen erledigen. Prüfe dies im Browser-Netzwerktest. Normale Abrufe des Anwendungscodes beim Hosting sind davon zu unterscheiden.

Kein GitHub-Token, API-Key, Passwort oder sonstiges Geheimnis darf in den Browsercode, das Repository, ein Buildartefakt oder ein Beispielbackup gelangen. Der GitHub-Connector dient der Entwicklung, nicht als Backend der fertigen App.

Die Bibliothek ist kein verschlüsselter Tresor. Daten liegen im Browserprofil; eine öffentliche App-URL ist nicht gleichbedeutend mit öffentlicher Freigabe meiner lokalen Dokumente, aber auch kein Zugriffsschutz gegen andere Personen am selben Browserprofil. Erkläre diese Grenze sachlich.

Beachte ausdrücklich die Origin-Grenze: Verschiedene Repository-Pfade unter derselben `USERNAME.github.io`-Domain bilden keine getrennten Sicherheitsbereiche für IndexedDB. Ein projektspezifischer Datenbankname schützt gegen versehentliche Kollisionen, nicht gegen beliebigen schädlichen Code unter demselben Origin. Ändere für dieses Projekt keine andere Website. Dokumentiere bei entsprechendem Schutzbedarf eine getrennte Origin als spätere Bereitstellungsoption; richte nicht eigenmächtig eine kostenpflichtige Domain ein.

Verwende eine zum tatsächlich erzeugten Build passende Content Security Policy, soweit auf statischem Hosting umsetzbar. Vermeide unsichere Inline-Skripte, `eval` und unnötige externe Verbindungen. Gib nicht vor, GitHub Pages würde über eine ignorierte Konfigurationsdatei frei definierte HTTP-Header ausliefern. Prüfe den realen Mechanismus.

Eine `noindex`-Anweisung ist optional gegen Auffindbarkeit, aber niemals eine Authentifizierung. Ebenso ist der Importparser kein allgemeiner Malware-Scanner für PDFs. Unterstützte Dateiverarbeitung und Sicherheitsgarantien sind sauber voneinander abzugrenzen.

## 20. Projektstruktur und Codequalität

Verwende folgende Struktur als konkreten Ausgangspunkt. Du darfst zusammengehörige kleine Dateien sinnvoll zusammenlegen oder zusätzliche echte Module ergänzen. Keine leeren Platzhalterdateien nur zur Erfüllung eines Baums. Jede im tatsächlich ausgelieferten Projekt referenzierte Datei muss existieren und funktionsfähig sein.

```text
skriptstudio/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── docs/
│   ├── MASTERPROMPT.md
│   ├── ARCHITECTURE.md
│   ├── BACKUP_FORMAT.md
│   ├── TEST_REPORT.md
│   └── LIMITATIONS.md
├── public/
│   └── favicon.svg
├── scripts/
│   └── generate-test-fixtures.mjs
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── useWorkspace.ts
│   ├── components/
│   │   ├── AppHeader.tsx
│   │   ├── SplitPane.tsx
│   │   ├── SaveStatus.tsx
│   │   └── Dialog.tsx
│   ├── features/
│   │   ├── library/
│   │   │   └── DocumentLibrary.tsx
│   │   ├── pdf/
│   │   │   ├── PdfViewer.tsx
│   │   │   ├── PdfControls.tsx
│   │   │   ├── PageNavigator.tsx
│   │   │   └── pdfService.ts
│   │   ├── notes/
│   │   │   ├── NoteEditor.tsx
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── NoteSearch.tsx
│   │   │   └── delta.ts
│   │   ├── backup/
│   │   │   ├── BackupDialog.tsx
│   │   │   ├── backupService.ts
│   │   │   └── backupSchema.ts
│   │   └── export/
│   │       ├── ExportDialog.tsx
│   │       ├── deltaToPdf.ts
│   │       └── exportService.ts
│   ├── storage/
│   │   ├── db.ts
│   │   ├── repositories.ts
│   │   ├── saveQueue.ts
│   │   ├── concurrency.ts
│   │   └── migrations.ts
│   ├── pwa/
│   │   └── updateManager.ts
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── app.css
│   │   └── editor.css
│   ├── types/
│   │   └── models.ts
│   ├── utils/
│   │   ├── hash.ts
│   │   └── download.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── unit/
│   │   ├── delta.test.ts
│   │   ├── saveQueue.test.ts
│   │   ├── backup.test.ts
│   │   └── export.test.ts
│   └── e2e/
│       ├── workspace.spec.ts
│       ├── persistence.spec.ts
│       ├── export-backup.spec.ts
│       └── offline.spec.ts
├── .gitignore
├── .nvmrc
├── AGENTS.md
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
└── README.md
```

Erzeuge Manifest und Service Worker entweder nachvollziehbar über die Build-Konfiguration oder als tatsächlich gepflegte Dateien. Dokumentiere die gewählte Variante. Fehlende generierte Dateien dürfen nicht von Hand als nicht funktionierende Attrappen angelegt werden.

Trenne UI, Persistenz, PDF-Verarbeitung, Formatkonvertierung und Importvalidierung. Keine tausendzeilige App-Komponente mit Datenbank-, Export- und Eventlogik in denselben Effekten. Halte die Architektur trotzdem überschaubar; keine generische Plugin-Plattform und kein Backend nur zur Erweiterbarkeit.

Implementiere vollständige Fehlerpfade und Cleanup. Kein unmotiviertes `any`, keine großflächig abgeschalteten TypeScript-/ESLint-Regeln und keine `.catch(() => {})`-Behandlung bei relevantem Datenverlust. Kommentiere vor allem schwierige Zuordnungs-, Transaktions- und Migrationsentscheidungen.

## 21. Lokales Setup und GitHub Pages

Dokumentiere eine verifizierte Node-LTS-Version und folgende tatsächlich funktionierende Befehle:

```bash
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run preview
```

`test` muss in CI terminieren, statt dauerhaft im Watch-Modus zu laufen. Dokumentiere die notwendige einmalige Installation der Playwright-Browser. Ein vollständiger Clean-Checkout mit dem Lockfile muss reproduzierbar installierbar sein.

Konfiguriere den Vite-Base-Pfad passend zur tatsächlichen Pages-Bereitstellung. Bei einem Project-Pages-Repository `skriptstudio` muss die App unter `/skriptstudio/` funktionieren, einschließlich Worker, Assets, Manifest, Offline-Caches und Downloads. Berücksichtige eine Root-/Custom-Domain-Bereitstellung über eine klar benannte Konfiguration, ohne alle Quellpfade manuell ändern zu müssen.

Die erste Version benötigt keinen History-Router. Nutze bei Bedarf Hash-Routing oder lokale Zustände, sodass ein Reload keine nicht vorhandene Serverroute aufruft. Dokumentnamen und Notizinhalte gehören nicht in öffentlich sichtbare URLs.

Die CI führt mindestens saubere Installation, Lint, Typecheck, Unit-/Integrationstests, Build und den zentralen Browser-Smoke-Test aus. Pull Requests werden geprüft, aber nicht automatisch auf die Live-Pages-Seite deployed.

Der Deployment-Workflow veröffentlicht ausschließlich den überprüften `dist`-Build. Verwende minimale, jobbezogene Berechtigungen, für Pages also die tatsächlich benötigten Lese-, Pages- und OIDC-Rechte. Keine zusätzlichen Secrets und kein persönlicher Token sind für den normalen Pages-Build nötig. Pinne Actions auf verifizierte Versionen beziehungsweise Commit-SHAs, nicht auf erfundene Pins.

Dokumentiere den einmaligen GitHub-Schritt „Settings → Pages → Source: GitHub Actions“, sofern der Connector diese Einstellung nicht ändern kann. Behaupte nicht, die Veröffentlichung sei erfolgt, nur weil eine Workflow-Datei existiert.

## 22. Automatisierte Abnahme und Testfälle

Erstelle synthetische, unproblematische Test-PDFs programmgesteuert. Verwende eindeutige Seitentexte, verschiedene Formate, Rotation und ausreichend umfangreiche Beispielnotizen. Committe keine echten Vorlesungsskripte, privaten PDFs, personenbezogenen Notizen oder Browserprofile.

### A. Kernablauf und Seitenzuordnung

Teste Import eines PDFs, sichtbare erste Seite, Formatierung aller Pflichttypen, Navigation per Button und Eingabe, Schreiben verschiedener Texte auf mindestens drei Seiten, Wiederherstellung jeder Notiz sowie korrektes Verhalten an erster und letzter Seite. Prüfe auch zwei unterschiedliche PDFs mit demselben Dateinamen und dasselbe PDF unter anderem Namen.

### B. Speichern, Rennen und Recovery

Teste schnelles Tippen und sofortiges Blättern, Wechsel während ausstehender Saves, verspätete Leseantworten, unterschiedlich lange Transaktionen und die korrekte Statusanzeige bei neueren Dirty-Revisionen. Prüfe Reload nach bestätigtem Save, dokumentierte Behandlung unbestätigter Eingaben, Wiederherstellung in einem erneut geöffneten persistenten Browserprofil und einen simulierten Datenbank-/Quota-Fehler. Prüfe, dass der Rettungsexport aktuelle In-Memory-Daten enthält.

Teste einen fehlgeschlagenen Save mit anschließendem erfolgreichen Retry und fortgesetzter Bearbeitung. Die Queue darf danach nicht dauerhaft defekt sein. Prüfe zwei Tabs und Konfliktauflösung ohne stillen Datenverlust. Prüfe, dass eine Datenbankmigration die alten Notizen erhält.

### C. Editor und Bedienung

Teste Undo/Redo ohne Eingriff in andere Seiten, Cursorverhalten während Autosave, Farbformatierung einer vorhandenen Auswahl, Word-artiges Copy/Paste im erlaubten Umfang und Abwehr nicht erlaubter Inhalte. Prüfe, dass Pfeiltasten und die betriebssystemtypische Wortnavigation im Editor weiterhin sinnvoll funktionieren.

Prüfe bei 1440 px und ungefähr 1024 px Breite den Desktop-Arbeitsbereich, bei Tabletbreite die gewählte Zwischenlösung und bei etwa 390 px den mobilen Wechsel zwischen PDF und Notizen. Prüfe keine unerreichbaren Toolbar-Elemente, keine Überlagerungen und keine ungewollt horizontal scrollende gesamte App. Kontrolliere Fokus, Dialoge und Splitter per Tastatur.

### D. PDF-Export

Lade das exportierte PDF erneut mit einem unabhängigen Leseweg beziehungsweise PDF.js und prüfe Seitenanzahl, Reihenfolge und Textinhalt. Bei N Originalseiten und k_i Notizseiten pro Originalseite muss die Ausgabe exakt `N + Summe(k_i)` Seiten enthalten.

Teste leere Notizen mit beiden Exportoptionen, mindestens eine Notiz mit mehr als drei A4-Seiten, lange Listen, Formatkombinationen, Farben, Ausrichtung, Umlaute und Statistikzeichen. Extrahiere den Notiztext aus dem Ergebnis, um dessen Vorhandensein und Durchsuchbarkeit zu prüfen. Kontrolliere zusätzlich gerenderte Exportseiten visuell; ein reiner Texttest beweist kein korrektes Layout.

Prüfe erhaltene Originalausrichtung und unterschiedliche Seitenformate. Prüfe Export direkt nach der letzten Eingabe ohne vorangehende Schreibpause. Prüfe Abbruch und erneuten Export. Ein abgebrochener Export darf keine angeblich vollständige Datei liefern.

### E. Backup und Import

Teste Notizen-Backup gegen identisches und falsches Original, Vollbackup in einem vollständig leeren Browserprofil, Lesezeichen und Formatierungen nach Wiederherstellung, korrekten Snapshot unmittelbar nach Eingabe sowie kontrollierten Import als neue Projektkopie.

Teste defektes JSON, unbekannte Versionsnummer, falsche Typen, ungültigen Seitenindex, doppelte Seiteneinträge, manipuliertes PDF/Base64, falschen Hash, unzulässige Delta-Attribute, gefährliche Objektkeys und Größenlimit-Verletzungen. Bestehende Daten müssen nach jedem abgewiesenen Import unverändert sein.

### F. Hosting, Offline und Datenschutz

Teste den Produktionsbuild ausdrücklich unter einem Repository-Unterpfad, nicht nur unter `/` im Dev-Server. Prüfe, dass PDF-Worker und alle übrigen Ressourcen ohne 404 laden.

Bereite Offline-Nutzung online vor, beende den Tab, deaktiviere das Netzwerk und öffne die App erneut. Teste Lesen, Schreiben, Wiederherstellung, erstmaligen PDF-Export in dieser Sitzung und Backup-Import. Prüfe App-Update-Hinweis ohne erzwungenen Reload und ohne Verlust offener Notizen. Prüfe, dass andere App-Caches des Origins unberührt bleiben.

Überwache Browserrequests und Logs. Notizen, Dateibytes oder private Testinhalte dürfen nicht zu externen Diensten gesendet oder in Diagnosereports geschrieben werden.

Führe den Kern-Smoke-Test in Chromium aus und ergänze Firefox/WebKit, soweit in der tatsächlichen Umgebung ausführbar. Ein WebKit-Test ist nicht automatisch ein vollständiger Test auf einem echten MacBook mit Safari. Liste nicht ausgeführte Plattformtests ausdrücklich als offen.

## 23. GitHub-Connector, Branches und Freigaben

Ermittle zunächst über einen echten Lesezugriff das verbundene Konto, verfügbare Repositories, das Zielrepository, dessen Standardbranch und vorhandene Dateien. Nutze ein eigenständiges neues Repository. Bestehende Projekte wie Tille, AGRA und das Morgenbriefing bleiben vollständig unangetastet.

Vorgeschlagener Owner ist `teuberleipzig-cpu`, vorgeschlagener Repositoryname `skriptstudio`. Erfinde keine Existenz, Schreibberechtigung oder Pages-Konfiguration. Ist ein anderes Repository ausdrücklich als Ziel genannt, verwende ausschließlich dieses nach Prüfung. Ist das Ziel nicht zugänglich, unterscheide fehlendes Repository, fehlende App-Freigabe und einen tatsächlichen Schreibfehler.

Prüfe die tatsächlich verfügbaren Connector-Aktionen. Wenn das Werkzeug kein Repository anlegen oder keine Pages-Administration ausführen kann, erkläre genau diesen einmaligen verbleibenden Schritt. Fordere keinen Token im Chat und versuche nicht, eine fehlende Administration über andere Projekte zu umgehen.

Für einen neuen, freigegebenen Repo-Start ist ein initialer Commit, beispielsweise eine README auf dem Standardbranch, hilfreich und gegebenenfalls erforderlich. Arbeite danach auf einem eigenen Feature-Branch wie `feat/initial-app`. Lies vor Änderungen den aktuellen Stand; respektiere bestehende README-, AGENTS- und Projektregeln. Kein Force-Push und keine ungesicherten Überschreibungen fremder Änderungen.

Dieser Auftrag erlaubt das Erstellen und Bearbeiten der Projektdateien, nachvollziehbare Commits, Pushes auf den isolierten Feature-Branch und einen Draft-Pull-Request im ausdrücklich freigegebenen neuen Repository. Er erlaubt keinen eigenmächtigen Merge, kein Aktivieren von Auto-Merge und keinen ersten Live-Deploy ohne meine ausdrückliche Freigabe. Bereite die Veröffentlichung technisch vor und halte die Freigabegrenze sichtbar ein.

Nutze den Connector zum Lesen und Schreiben. Für Build und Tests darfst du eine tatsächlich verfügbare lokale Laufzeit oder GitHub Actions verwenden. Ein Dateischreib-Connector allein führt keine Tests aus. Sind bestimmte Tests nur in CI möglich, richte sie ein und lies deren tatsächliche Ergebnisse, anstatt lokale Erfolge zu behaupten.

Nach dem Schreiben verifiziere den relevanten Branch-Head und die Änderungen. Bei einem Ref-Konflikt lies den neuen Stand und gleiche ihn ab; überschreibe nicht blind. Bei einem Fehler liefere den vollständigen lokal vorbereiteten Stand als Dateien oder Archiv und benenne, welche GitHub-Schritte noch nicht erfolgt sind.

## 24. Umsetzungsetappen

**Etappe 1 — Architektur und lauffähiges Fundament:** Prüfe Repository und Werkzeuge, dokumentiere verbindliche Entscheidungen, richte Vite/React/TypeScript, Styles, Grundlayout, CI und Basis-Tests ein. Das Projekt muss bereits installierbar und baubar sein.

**Etappe 2 — Vollständiger lokaler Kern:** Implementiere PDF-Import, Viewer, Navigation, Quill, eindeutige Seitenbindung, IndexedDB, Auto-Save, Status und Wiederherstellung. Prüfe sofort die kritischen Race-Conditions und Fehlerszenarien.

**Etappe 3 — Portabilität und Export:** Implementiere validierte Backups, sichere Imports, echtes Rich-Text-PDF-Layout und die Zusammenführung. Prüfe lange Notizen und einen Restore in einem frischen Browserprofil.

**Etappe 4 — Lernworkflow und Offline:** Ergänze Bibliothek, Lernnavigation, Suche, PWA, Offline-Export und sichere Updates. Prüfe Desktop, mobile Bedienung und mehrere Tabs.

**Etappe 5 — Review und Bereitstellungsvorbereitung:** Führe Clean-Install, Lint, Typecheck, Unit-/Integrationstests, Browsertests, Build und Review aus. Behebe gefundene Fehler. Schreibe den Testbericht und erstelle den Draft-PR. Keine zusätzlichen Komfortfunktionen einschieben, solange Kernfehler offen sind.

Die Etappen sind eine Arbeitsgliederung, keine Rechtfertigung für einen unvollständigen Endzustand. Liefere möglichst den ganzen angefragten Stand. Verbleibende technische Hindernisse sind konkret und wahrheitsgemäß zu dokumentieren.

## 25. Dokumentation und Übergabe

Schreibe eine deutschsprachige README mit Produktzweck, Kernfunktionen, lokalem Setup, GitHub-Pages-Einrichtung, Shortcuts, Backup-Anleitung, Gerätewechsel, Offline-Voraussetzungen und tatsächlichen Grenzen.

`ARCHITECTURE.md` beschreibt Datenfluss, Seitenbindung, Speicherschlange, Revisions-/Konfliktstrategie, Exportmodell und PWA-Update-Verhalten. `BACKUP_FORMAT.md` dokumentiert Formatversion, Felder, Validierung und Kompatibilität. `LIMITATIONS.md` nennt bewusst nicht unterstützte Funktionen und nachgewiesene Einschränkungen. `AGENTS.md` hält die relevanten Entwicklungs-, Datenschutz- und Freigaberegeln für spätere Bearbeitungen fest.

`TEST_REPORT.md` enthält Datum, tatsächliche Versionen, getesteten Code-Stand, ausgeführte Befehle, beobachtete Ergebnisse, Browser, repräsentative Dokumentgrößen und offene Prüfungen. Verwende zur Identifikation einen verifizierten Code-Commit oder CI-Run; erfinde keinen selbstreferenziellen finalen SHA für eine noch nicht geschriebene Datei.

Liefere vollständigen Quellcode und alle benötigten Konfigurationen im Repository. Keine ausgelassenen Pflichtfunktionen, kein Pseudocode, keine Platzhalterhandler, kein „hier den Rest ergänzen“. Eine ZIP-Datei des vollständigen Projekts ist eine zulässige zusätzliche Übergabe, aber kein Ersatz für behauptete, tatsächlich nicht erfolgte GitHub-Schreibaktionen. Liefere keine `node_modules`, echten Nutzerdaten oder privaten Schriftdateien mit.

Die Abschlussmeldung enthält eine klare Zusammenfassung: implementierte Funktionen, Repository und Branch, gegebenenfalls Commit und Draft-PR, tatsächlich bestandene Tests, nicht ausgeführte Tests, Deploymentstatus und exakt die verbleibende notwendige Nutzeraktion. Gib eine öffentliche App-URL nur als live aus, wenn ihre Bereitstellung wirklich bestätigt ist.

## 26. Definition of Done

Das Projekt ist für die technische Erstabnahme fertig, wenn ich ein gewöhnliches PDF öffnen, auf unterschiedlichen Seiten formatierte Notizen schreiben, schnell blättern, den bestätigten Arbeitsstand nach Reload wiederherstellen, ein vollständiges Projektbackup exportieren und in einem leeren Browserprofil importieren sowie ein korrekt sortiertes, vollständig lesbares PDF mit beliebig vielen erforderlichen Notizseiten innerhalb der getesteten Größenlimits erzeugen kann.

Alle sichtbaren Pflichtaktionen funktionieren. Originale und andere Projekte bleiben unberührt. Falsche Seitenzuordnung, stilles Überschreiben, abgeschnittene Exporte, ein unehrlicher Speicherstatus, defekte Backups und externe Übertragung von Dokumentinhalten sind Release-Blocker.

Der vollständige Build funktioniert unter dem tatsächlichen GitHub-Pages-Unterpfad. Offline-Funktionalität ist entweder nachweislich getestet oder ausdrücklich noch nicht als fertig ausgewiesen. Die Ausführung der relevanten Tests ist belegt. Der Code ist vollständig eingecheckt oder, bei einem konkret benannten Connector-Hindernis, vollständig als lokales Übergabeartefakt vorhanden.

Ein fehlender manueller Repositoryzugriff, eine noch nicht erteilte Merge-Freigabe oder eine ausstehende Pages-Aktivierung darf nicht mit einer fehlenden Implementierung verwechselt werden. Ebenso darf eine geschriebene README oder Workflow-Datei nicht als fertig gebaute und getestete Anwendung ausgegeben werden.

**Beginne jetzt mit der tatsächlichen Repository-Prüfung und der knappen Architekturentscheidung. Setze anschließend die freigegebenen Entwicklungsschritte eigenständig um.**
