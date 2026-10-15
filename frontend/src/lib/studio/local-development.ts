/** Local, no-paid-API source templates. Never pretend to perform arbitrary code generation. */
export type DevKind="apps"|"systems";
export type DevFile={path:string;content:string};
const normalizeName=(prompt:string,kind:DevKind)=>{
 const first=prompt.split(/[\n.!?]/)[0]||"";
 return (first.replace(/^(?:crie|quero|preciso|faça|monte|desenvolva)\s+(?:um|uma)?\s*(?:app|aplicativo|sistema|painel)\s*(?:de|para|sobre)?\s*/i,"").replace(/[<>]/g,"").trim().slice(0,68)|| (kind==="apps"?"Meu Aplicativo":"Meu Sistema"));
};
const category=(prompt:string)=>/agend|horário|horario|reserva|cliente|consult/i.test(prompt)?"Agendamentos":/loja|produto|estoque|catálogo|catalogo|pedido/i.test(prompt)?"Produtos":"Tarefas";
function appFiles(name:string,group:string,prompt:string):DevFile[]{
 const src=[
 'import React,{useState} from "react";',
 'import {SafeAreaView,ScrollView,Text,TextInput,Pressable,View,StyleSheet} from "react-native";',
 'type Item={id:string;name:string;done:boolean};',
 'export default function App(){',
 ' const [items,setItems]=useState<Item[]>([]);const [name,setName]=useState("");',
 ' const add=()=>{if(name.trim()){setItems(current=>[{id:Date.now().toString(),name:name.trim(),done:false},...current]);setName("");}};',
 ' const remove=(id:string)=>setItems(items=>items.filter(item=>item.id!==id));',
 ' return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>',
 ' <Text style={styles.brand}>PAGENOVA · MODELO LOCAL</Text>',
 ' <Text style={styles.title}>__PROJECT_TITLE__</Text>',
 ' <Text style={styles.subtitle}>Gerencie __GROUP__ em um projeto inicial interativo.</Text>',
 ' <View style={styles.panel}><Text style={styles.heading}>__GROUP__</Text>',
 ' <TextInput style={styles.field} placeholder="Digite um novo item" placeholderTextColor="#777" value={name} onChangeText={setName}/>',
 ' <Pressable style={styles.button} onPress={add}><Text style={styles.buttonText}>Adicionar</Text></Pressable>',
 ' {items.map(item=><View key={item.id} style={styles.row}>',
 ' <Pressable onPress={()=>setItems(current=>current.map(x=>x.id===item.id?{...x,done:!x.done}:x))} style={{flex:1}}><Text style={[styles.item,item.done&&styles.done]}>{item.done?"✓ ":"○ "}{item.name}</Text></Pressable>',
 ' <Pressable onPress={()=>remove(item.id)}><Text style={styles.remove}>Excluir</Text></Pressable></View>)}',
 ' {!items.length&&<Text style={styles.empty}>Nenhum item cadastrado ainda.</Text>}</View>',
 ' <Text style={styles.note}>Protótipo local: os dados não são sincronizados nem persistidos depois de fechar o aplicativo.</Text>',
 ' </ScrollView></SafeAreaView>}',
 'const styles=StyleSheet.create({page:{flex:1,backgroundColor:"#0c1712"},content:{padding:24,paddingTop:48},brand:{color:"#8ae5b6",fontSize:12,fontWeight:"700"},title:{color:"white",fontSize:32,fontWeight:"800",marginTop:20},subtitle:{color:"#b7c8bd",marginTop:12,fontSize:15},panel:{padding:18,backgroundColor:"#172920",borderRadius:20,marginTop:30},heading:{color:"white",fontWeight:"700",fontSize:22,marginBottom:14},field:{backgroundColor:"#f5fff9",color:"#122519",padding:14,borderRadius:10,fontSize:16},button:{marginTop:10,backgroundColor:"#9af2bf",padding:14,borderRadius:10,alignItems:"center"},buttonText:{color:"#122519",fontWeight:"800"},row:{paddingVertical:17,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#385440"},item:{color:"white",fontSize:15},done:{textDecorationLine:"line-through",color:"#9aac9f"},remove:{color:"#ffc8b5",fontSize:12},empty:{marginTop:20,color:"#acc5b4"},note:{color:"#acc5b4",fontSize:12,marginTop:24,lineHeight:20}});'
 ].join("\n").replaceAll("__PROJECT_TITLE__",name.replace(/"/g,"")).replaceAll("__GROUP__",group);
 return [
 {path:"package.json",content:JSON.stringify({name:"pagenova-expo-starter",version:"1.0.0",private:true,main:"node_modules/expo/AppEntry.js",scripts:{start:"expo start",android:"expo start --android",ios:"expo start --ios"},dependencies:{expo:"~54.0.0",react:"19.1.0","react-native":"0.81.5"},devDependencies:{typescript:"~5.9.2","@types/react":"~19.1.10"}},null,2)},
 {path:"app.json",content:JSON.stringify({expo:{name,slug:"pagenova-local",version:"1.0.0",orientation:"portrait",android:{package:"com.example.pagenovalocal"}}},null,2)},
 {path:"tsconfig.json",content:JSON.stringify({extends:"expo/tsconfig.base",compilerOptions:{strict:true}},null,2)},
 {path:"App.tsx",content:src},
 {path:"README.md",content:["# "+name,"","Modelo funcional Expo / React Native com cadastro e remoção de "+group+".","Sem IA e sem APIs pagas.","","Rodar: npm install; npm start.","Dados apenas em memória. Para publicar nas lojas, implemente persistência e contas de desenvolvedor, configure assinatura e teste seu aplicativo.","","Briefing recebido: "+prompt.slice(0,1200)].join("\n")}
 ];
}
function systemFiles(name:string,group:string,prompt:string):DevFile[]{
 const src=[
 '"use client";',
 'import {useEffect,useState} from "react";',
 'type Item={id:string;name:string;done:boolean};',
 'export default function Home(){',
 ' const [items,setItems]=useState<Item[]>([]);const [draft,setDraft]=useState("");const [loaded,setLoaded]=useState(false);',
 ' useEffect(()=>{try{const raw=localStorage.getItem("pagenova-local-project");if(raw){const old=JSON.parse(raw);if(Array.isArray(old))setItems(old);}}catch{}setLoaded(true);},[]);',
 ' useEffect(()=>{if(loaded)try{localStorage.setItem("pagenova-local-project",JSON.stringify(items));}catch{}},[items,loaded]);',
 ' function add(){if(draft.trim()){setItems(current=>[{id:Date.now().toString(),name:draft.trim(),done:false},...current]);setDraft("");}}',
 ' return <main><div className="wrap"><span className="brand">PAGENOVA · MODELO LOCAL</span><h1>__PROJECT_TITLE__</h1>',
 ' <p className="lead">Organize seus __GROUP__ com um painel responsivo e armazenamento local.</p>',
 ' <section className="card"><h2>__GROUP__</h2><form onSubmit={e=>{e.preventDefault();add();}}><input aria-label="Novo item" placeholder="Digite um novo item" value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit">Adicionar</button></form>',
 ' <ul>{items.map(item=><li key={item.id}><label><input type="checkbox" checked={item.done} onChange={()=>setItems(v=>v.map(x=>x.id===item.id?{...x,done:!x.done}:x))}/><span className={item.done?"done":""}>{item.name}</span></label><button type="button" className="remove" onClick={()=>setItems(v=>v.filter(x=>x.id!==item.id))}>Excluir</button></li>)}</ul>',
 ' {!items.length&&<p className="empty">Nenhum item cadastrado ainda.</p>}</section>',
 ' <p className="note">Rascunho: dados somente neste navegador, sem acesso multiusuário ou banco.</p></div></main>}',
 ].join("\n").replaceAll("__PROJECT_TITLE__",name.replace(/[<>&]/g,"")).replaceAll("__GROUP__",group.toLowerCase());
 const css="*{box-sizing:border-box}body{margin:0;background:#091610;color:#f7fff9;font:15px/1.6 Arial,sans-serif}.wrap{max-width:960px;margin:auto;padding:65px 22px}.brand{color:#92efb9;letter-spacing:2px;font-size:11px;font-weight:bold}h1{font-size:clamp(30px,5vw,54px);margin:16px 0}.lead{color:#b2c9bd}.card{background:#16261c;border:1px solid #2b5d3f;padding:23px;border-radius:18px;margin-top:35px}form{display:flex;gap:10px;margin:20px 0}input:not([type=checkbox]){flex:1;min-width:0;background:#f6fff8;color:#142419;border:0;border-radius:8px;padding:12px;font:inherit}button{background:#90efb9;border:0;color:#103022;font-weight:bold;padding:11px 17px;border-radius:8px;cursor:pointer}ul{list-style:none;padding:0}li{display:flex;gap:12px;justify-content:space-between;align-items:center;border-top:1px solid #2c4638;padding:15px 0}li label{display:flex;align-items:center;gap:12px;min-width:0;overflow-wrap:anywhere}.done{text-decoration:line-through;color:#a3bcae}.remove{background:#2b4836;color:#ffd1c3}.note,.empty{color:#b0c4b9;font-size:12px;margin-top:25px}@media(max-width:520px){form{flex-direction:column}}";
 return [
 {path:"package.json",content:JSON.stringify({name:"pagenova-next-starter",version:"1.0.0",private:true,scripts:{dev:"next dev",build:"next build",start:"next start"},dependencies:{next:"16.0.0",react:"19.2.0","react-dom":"19.2.0"},devDependencies:{typescript:"^5.7.3","@types/node":"^22.0.0","@types/react":"^19.0.0","@types/react-dom":"^19.0.0"}},null,2)},
 {path:"tsconfig.json",content:JSON.stringify({compilerOptions:{target:"ES2017",lib:["dom","dom.iterable","esnext"],allowJs:true,skipLibCheck:true,strict:true,noEmit:true,esModuleInterop:true,module:"esnext",moduleResolution:"bundler",resolveJsonModule:true,isolatedModules:true,jsx:"react-jsx",incremental:true,plugins:[{name:"next"}]},include:["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],exclude:["node_modules"]},null,2)},
 {path:"app/layout.tsx",content:'import "./globals.css";\nexport default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}'},
 {path:"app/globals.css",content:css},
 {path:"app/page.tsx",content:src},
 {path:"README.md",content:["# "+name,"","Modelo funcional Next.js, sem IA externa.","","Rodar: npm install; npm run dev; npm run build.","","Os dados são guardados somente no navegador atual. Produção com múltiplos usuários exige banco de dados, autenticação e testes.","","Briefing recebido: "+prompt.slice(0,1200)].join("\n")}
 ];
}
export function localDevelopment(kind:DevKind,prompt:string,existing:DevFile[]){
 const name=normalizeName(prompt,kind),group=category(prompt);
 if(existing.length)return {name,summary:"O projeto anterior foi preservado. O modo sem IA não altera código livremente por conversa; baixe o ZIP e edite os arquivos no seu ambiente.",files:existing,
 nextSteps:["Exporte o ZIP antes de fazer alterações.","Para mudanças estruturais além do modelo local, edite o código.","Publicação requer configuração e testes próprios."]};
 const files=kind==="apps"?appFiles(name,group,prompt):systemFiles(name,group,prompt);
 return {name,summary:"Modelo local interativo de "+group.toLowerCase()+" em "+(kind==="apps"?"Expo":"Next.js")+". O modelo permite adicionar, marcar e excluir itens; não interpreta funcionalidades arbitrárias do briefing.",
  files,nextSteps:kind==="apps"?["Execute npm install e npm start.","Teste no Expo Go.","Configure persistência e compilação assinada antes da loja."]:
  ["Execute npm install e npm run dev.","Teste npm run build.","Configure banco e autenticação antes de publicar para clientes."]};
}
