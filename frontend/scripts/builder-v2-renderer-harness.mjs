import {createRequire} from "node:module";
import Module from "node:module";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const require=createRequire(import.meta.url);
const ts=require("typescript");
const src=fileURLToPath(new URL("../src/",import.meta.url));
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(name,...rest){return originalResolve.call(this,name.startsWith("@/")?resolve(src,name.slice(2)):name,...rest);};
for(const extension of [".ts",".tsx"]){
 require.extensions[extension]=(module,filename)=>module._compile(ts.transpileModule(readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
}
require.extensions[".css"]=()=>{};
const React=require("react"),{renderToStaticMarkup}=require("react-dom/server");
const {load}=require("cheerio");
const {BuilderV2Site}=require("../src/components/builder-v2-site.tsx");
export const fixture=()=>({id:"universal-render-test",title:"Empresa de teste",background:"#ffffff",templateId:"institutional-complete",blocks:[
 {id:"hero",type:"heading",text:"Título editado",section:"inicio",layout:"hero",color:"#663399",colorExplicit:true,align:"left",fontSize:48,mobileFontSize:26},
 {id:"intro",type:"paragraph",text:"Descrição cadastrada",section:"inicio",color:"#111111",align:"left",fontFamily:"Georgia",mobileFontSize:18},
 {id:"cta",type:"button",text:"Consultar",section:"inicio",color:"#000000",textColor:"#ffffff",align:"left",href:"/contato?origem=site#form",fontFamily:"Georgia",fontSize:19,mobileFontSize:16},
 {id:"faq",type:"heading",text:"Dúvidas",section:"faq",layout:"faq",color:"#111111",align:"left"},
 {id:"question",type:"paragraph",text:"Como entrar em contato? Utilize o botão disponível.",section:"faq",color:"#111111",align:"left"}
]});
export const renderHtml=(site,publishedMode)=>renderToStaticMarkup(React.createElement(BuilderV2Site,{site,publishedMode}));
export const render=(site,publishedMode)=>load(renderHtml(site,publishedMode));
