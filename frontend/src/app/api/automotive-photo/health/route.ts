import {NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
export const runtime="nodejs";
export const dynamic="force-dynamic";
/** Reports first-party asset readiness; does not depend on external image hosts. */
export async function GET(){
 const names=["hero",...Array.from({length:6},(_,i)=>`service-${i}`)];
 const extensions=["webp","jpg","jpeg","png"];
 const assets=await Promise.all(names.map(async name=>{
  for(const ext of extensions){
   try{
    const data=await readFile(join(process.cwd(),"public","images","automotive",`${name}.${ext}`));
    const valid=data.byteLength>=2000&&data.byteLength<=8_000_000&&(
     (data[0]===255&&data[1]===216&&data[2]===255)||
     (data[0]===137&&data[1]===80&&data[2]===78&&data[3]===71)||
     (data.toString("ascii",0,4)==="RIFF"&&data.toString("ascii",8,12)==="WEBP")
    );
    return {name,ready:valid,format:ext};
   }catch{/* Check other supported formats */}
  }
  return {name,ready:false};
 }));
 const ready=assets.every(asset=>asset.ready);
 return NextResponse.json({ready,readyCount:assets.filter(a=>a.ready).length,total:assets.length,assets},{
  status:ready?200:503,headers:{"Cache-Control":"no-store"}
 });
}
