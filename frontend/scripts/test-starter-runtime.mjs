/** Local app/system starter smoke tests; zero API calls, no customer data. */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../");
const ts=createRequire(resolve(root,"package.json"))("typescript");
function load(path){
  const output=ts.transpileModule(readFileSync(resolve(root,path),"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  const mod={exports:{}};
  new Function("module","exports",output)(mod,mod.exports);
  return mod.exports;
}
function assert(value,message){if(!value)throw Error(message);}
const {localDevelopment}=load("src/lib/studio/local-development.ts");
const {sourceZip}=load("src/lib/development/zip.ts");
for(const kind of ["apps","systems"]){
  const prompt='Crie um '+(kind==="apps"?"aplicativo":"sistema")+' de tarefas chamado Painel "{teste}"';
  const project=localDevelopment(kind,prompt,[]);
  assert(project.files?.length>=5,"Missing source files for "+kind);
  const main=project.files.find(file=>file.path===(kind==="apps"?"App.tsx":"app/page.tsx"));
  assert(Boolean(main),"Missing TSX entry for "+kind);
  const syntax=ts.createSourceFile("generated.tsx",main.content,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert(syntax.parseDiagnostics.length===0,
    "Generated "+kind+" TSX has syntax errors: "+syntax.parseDiagnostics.map(x=>x.messageText).join("; "));
  assert(!main.content.includes("__PROJECT_TITLE__"),"Project title was not substituted.");
  const zip=sourceZip(project.files);
  assert(zip.type==="application/zip"&&zip.size>1000,"ZIP export invalid for "+kind);
  const first=new DataView(await zip.arrayBuffer()).getUint32(0,true);
  assert(first===0x04034b50,"ZIP file header missing for "+kind);
}
// A downloaded ZIP must never write outside its chosen extraction folder.
const hostile=[
  [{path:"../outside.txt",content:"bad"}],
  [{path:"C:\\\\outside.txt",content:"bad"}],
  [{path:"dir/../../evil",content:"bad"}],
  [{path:"dir//invalid",content:"bad"}],
  [{path:"same.txt",content:"one"},{path:"same.txt",content:"two"}],
];
for(const files of hostile){
  let rejected=false;
  try{sourceZip(files);}catch{rejected=true;}
  assert(rejected,"ZIP exporter accepted unsafe or duplicate source path: "+files[0].path);
}
console.log("Local starters PASS: Expo and Next TSX parsed; ZIP generated and unsafe paths rejected.");
