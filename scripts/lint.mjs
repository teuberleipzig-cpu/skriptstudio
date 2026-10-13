import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { typescript } from './tooling.mjs';
const ts=typescript(), errors=[];
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?walk(join(dir,f.name)):[join(dir,f.name)]);
const files=walk('src').concat(walk('tests/unit'),walk('tests/e2e')).filter(f=>/\.tsx?$/.test(f));
for(const file of files) {
  const text=readFileSync(file,'utf8');const tree=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  for(const d of tree.parseDiagnostics) errors.push(`${file}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`);
  function fail(node,message) { const loc=tree.getLineAndCharacterOfPosition(node.getStart(tree));errors.push(`${file}:${loc.line+1}:${loc.character+1} ${message}`); }
  function visit(node) {
    if(node.kind===ts.SyntaxKind.AnyKeyword)fail(node,'Explizites any ist nicht erlaubt.');
    if(ts.isDebuggerStatement(node))fail(node,'Debugger-Anweisung ist nicht erlaubt.');
    if(ts.isCatchClause(node)&&node.block.statements.length===0)fail(node,'Leere Fehlerbehandlung ist nicht erlaubt.');
    if(ts.isJsxAttribute(node)&&node.name.getText(tree)==='dangerouslySetInnerHTML')fail(node,'Ungeprüftes Editor-HTML ist nicht erlaubt.');
    if(ts.isCallExpression(node)&&node.expression.getText(tree)==='eval')fail(node,'eval ist nicht erlaubt.');
    if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)&&node.moduleSpecifier.text.startsWith('.')) {
      const path=resolve(dirname(file),node.moduleSpecifier.text.split('?')[0]);
      if(!['','.ts','.tsx','.mjs','.js','.css','/index.ts','/index.tsx'].some(ext=>existsSync(path+ext))) fail(node,'Relative Importdatei fehlt: '+node.moduleSpecifier.text);
    }
    ts.forEachChild(node,visit);
  }
  visit(tree);
  if(/@ts-(ignore|nocheck)/u.test(text))errors.push(`${file}: TypeScript-Prüfung darf nicht abgeschaltet werden.`);
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Projekt-Lint: ${files.length} TypeScript-Dateien syntaktisch geprüft; Importpfade und Sicherheitsregeln bestanden. Kein Ersatz für den vollständigen Typecheck.`);
