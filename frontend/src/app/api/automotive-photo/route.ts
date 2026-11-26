import {NextRequest,NextResponse} from "next/server";
import {readFile} from "node:fs/promises";
import {join} from "node:path";

/** Same-origin image gateway for the six Vértice Auto Center service cards. */
export const runtime="nodejs";
const photos=[
 "photo-1486262715619-67b85e0b08d3",
 "photo-1493238792000-8113da705763",
 "photo-1544636331-e26879cd4d9b",
 "photo-1507136566006-cfc505b114fc",
 "photo-1614200187524-dc4b892acf16",
 "photo-1542362567-b07e54358753"
] as const;
export async function GET(request:NextRequest){
 const raw=request.nextUrl.searchParams.get("slot")||"";
 if(!/^(?:[0-5]|hero)$/.test(raw))return new NextResponse("Invalid photo slot",{status:400});
 const slot=raw==="hero"?0:Number(raw);
 // Prefer packaged, versioned photographs. Once the six files are installed,
 // rendering no longer requires an external image provider.
 for(const extension of ["webp","jpg","jpeg","png"]){
  try{
   const bytes=await readFile(join(process.cwd(),"public","images","automotive",`${raw==="hero"?"hero":`service-${slot}`}.${extension}`));
   if(bytes.byteLength<2000||bytes.byteLength>8_000_000)continue;
   const valid=extension==="webp"
    ?bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP"
    :extension==="png"
     ?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71
     :bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
   if(!valid)continue;
   const type=extension==="jpg"||extension==="jpeg"?"image/jpeg":extension==="png"?"image/png":"image/webp";
   return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":type,"Cache-Control":"public, max-age=300, s-maxage=3600, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff","X-PageNova-Image-Source":"local"}});
  }catch{/* Asset not installed yet; keep existing gateway as transitional fallback. */}
 }
 const sources=[photos[slot],photos[(slot+1)%photos.length],photos[(slot+2)%photos.length]];
 for(const id of sources){
  try{
   const response=await fetch(`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`,{signal:AbortSignal.timeout(6500),headers:{Accept:"image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8"}});
   const type=response.headers.get("content-type")||"";
   if(!response.ok||!type.startsWith("image/"))continue;
   const bytes=await response.arrayBuffer();
   if(bytes.byteLength<2000||bytes.byteLength>8_000_000)continue;
   return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800","X-Content-Type-Options":"nosniff"}});
  }catch{/* Try next allowlisted photo */}
 }
 return new NextResponse("Photo temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
}
