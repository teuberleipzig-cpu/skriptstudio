import { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { errorText } from '../types/models';
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const [storage, setStorage] = useState('Speicherstatus wird ermittelt …');
  useEffect(() => { void readStorage(); }, []);
  async function readStorage(request = false) {
    try {
      if (!navigator.storage) { setStorage('Dieser Browser bietet keine Speicherabfrage an. Regelmäßige Backups bleiben notwendig.'); return; }
      const persisted = request ? await navigator.storage.persist?.() : await navigator.storage.persisted?.();
      const estimate = await navigator.storage.estimate?.();
      setStorage(`${persisted ? 'Persistenter Speicher ist bewilligt.' : 'Persistenter Speicher ist nicht bewilligt.'} Geschätzte Belegung dieses Origins: ${Math.round((estimate?.usage ?? 0) / 1024 / 1024)} MiB; geschätzte Quote: ${Math.round((estimate?.quota ?? 0) / 1024 / 1024)} MiB. Das ist keine Speicher- oder Sicherungsgarantie.`);
    } catch (error: unknown) { setStorage(errorText(error)); }
  }
  return <Dialog title="Hilfe & Datenschutz" onClose={onClose}>
    <h3>Deine Dateien bleiben hier</h3><p>GitHub Pages liefert nur den Programmcode. PDFs und Notizen werden im Browserprofil gespeichert, nicht in GitHub oder eine Cloud übertragen. Die Bibliothek ist kein verschlüsselter Tresor und nicht vor anderen Personen an diesem Browserprofil geschützt.</p>
    <p>Browserdaten können gelöscht werden. Privatmodus und abrupte Prozessabbrüche können ungesicherte Eingaben verlieren. Lade regelmäßig vollständige Projektbackups herunter. Ein PDF-Export ist kein bearbeitbares Backup.</p>
    <h3>Tastatur</h3><dl><dt>Strg/Cmd + S</dt><dd>Offene Notizen speichern.</dd><dt>Strg/Cmd + B / I / U</dt><dd>Fett, kursiv, unterstrichen.</dd><dt>Strg/Cmd + Z / Umschalt + Z</dt><dd>Rückgängig / Wiederholen. Die Historie wird beim Seitenwechsel zurückgesetzt.</dd><dt>Alt + Pfeil links / rechts</dt><dd>Seitenwechsel außerhalb des Editors, von Eingabefeldern und Dialogen. Mac-Wortnavigation im Editor bleibt erhalten.</dd><dt>Splitter: Pfeil links / rechts; Pos1</dt><dd>Spaltenbreite ändern; Standardaufteilung wiederherstellen. Doppelklick setzt sie ebenfalls zurück.</dd></dl>
    <h3>Offline & Updates</h3><p>Erst bei „Offline bereit“ sind Programm, Viewer, Schriften und Exportressourcen vollständig vorbereitet. Ein neues Browserprofil kann die App nicht erstmals offline öffnen. Updates laden keinen Tab ungefragt neu. Nach dem Sichern alle SkriptStudio-Tabs schließen und erneut öffnen.</p>
    <h3>Grenzen</h3><p>Bis zu 150 MiB pro unverschlüsseltem PDF, maximal 5.000 Originalseiten. Diese Eingangsschranken sind keine Leistungszusage. Kein OCR; Scans erhalten keinen kopierbaren Text. Keine Bilder oder Tabellen im Editor. Exporte unterstützen nicht jedes Unicode-Zeichen oder Emoji und melden fehlende Zeichen.</p>
    <p>Unterschiedliche Repository-Pfade auf derselben github.io-Domain teilen einen Origin. Ein eigener Datenbankname schützt nicht gegen fremden schädlichen Code auf demselben Origin. Für höheren Schutzbedarf ist eine getrennte Origin erforderlich.</p>
    <div className="notice-box"><p>{storage}</p><button onClick={() => void readStorage(true)}>Persistenten Speicher anfragen</button></div>
    <footer className="dialog-actions"><button onClick={onClose}>Schließen</button></footer>
  </Dialog>;
}
