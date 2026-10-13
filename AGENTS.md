# Entwicklungsregeln für SkriptStudio

Verbindliche Produktspezifikation: docs/MASTERPROMPT.md. Vor Änderungen README, TEST_REPORT und LIMITATIONS lesen. Fehlende Nachweise nicht als erfolgreiche Abnahme darstellen.

Nur das eigenständige Repository teuberleipzig-cpu/skriptstudio bearbeiten. Andere Projekte bleiben unangetastet. Vor Remote-Schreiben aktuellen Head und vorhandene Projektregeln lesen. Die Repositoryfreigabe wurde am 13.10.2026 erneut geprüft; Feature-Branch-Anlage und Fast-forward-Commit funktionierten.

Feature-Branch feat/initial-app, nachvollziehbare Commits, Draft-PR. Kein Force-Push, kein Auto-Merge, kein Merge oder erster Live-Deploy ohne ausdrückliche Freigabe. GitHub Connector für Nutzer-Repositoryaktionen nutzen. Initialer main-Commit: be38f8456fe033aff8cc661d6446c18178fba9ed. Lokale Git-Commits sind keine Remote-Commits.

Notizen nur als vollständige validierte Delta-Dokumente speichern. Schlüssel [documentId, pageIndex] und Revision beim Ereignis unveränderlich erfassen. Ältere DB-Leseergebnisse dürfen neuere Memory-Revisionen nicht ersetzen. Fehler müssen Memory erhalten und Retry/Backup ermöglichen. Gespeichert nur nach bestätigter Transaktion ohne neuere offene Revisionen. Große PDF-Blobs nie bei jeder Notizänderung erneut schreiben.

Keine fremden Datenbanken/Caches löschen. Kein Umgehen von PDF-Verschlüsselung über ignoreEncryption. Keine PDF-Scripts, eingebetteten Notizbilder, externen Schrift-CDNs, Analytics oder Datenübertragung. Keine realen Skripte, Notizen, Tokens, Passwörter, Browserprofile oder privaten Systemfontdateien in Repo/Testartefakte/Logs aufnehmen.

Keine erfundenen Lockfiles, Versionsnummern, Tests oder Deployments. Das echte Lockfile wurde in Actions-Run 38401700980 unter Node 24.21.0 / npm 11.19.0 erzeugt und mit npm ci --ignore-scripts überprüft. Diese Prüfung ist keine vollständige App-Abnahme. Der temporäre Resolve-Workflow wurde nach Übernahme des unveränderten Lock-Blobs entfernt. Normale CI hat nur contents:read.

Vor Abnahme Clean-Install, Lint, vollständiger Typecheck, Node-Kerntests, Vitest/Dexie, Produktionsbuild, Playwright gegen /skriptstudio/, echte PDF-Text-/Layoutprüfung, Vollbackup-Restore und Offline-Neustart ausführen. Die vorhandenen Kerntests sind nur ein Teil der Abnahme. Release-Blocker: falsche Zuordnung, stille Überschreibung, falscher Speicherstatus, Datenverlust, abgeschnittene Exporte oder externe Übertragung.
