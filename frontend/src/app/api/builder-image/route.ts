import {NextRequest,NextResponse} from "next/server";

/** Restricted same-origin gateway for public editorial photos in Builder previews. */
export const runtime="nodejs";
const hosts=new Set(["images.unsplash.com","images.pexels.com","unsplash.com"]);
export async function GET(request:NextRequest){
 const raw=request.nextUrl.searchParams.get("url");
 if(!raw||raw.length>1600)return new NextResponse("Invalid image URL",{status:400});
 let url:URL;
 try{url=new URL(raw);}catch{return new NextResponse("Invalid image URL",{status:400});}
 if(url.protocol!=="https:"||!hosts.has(url.hostname)||url.username||url.password||url.port)return new NextResponse("Unsupported image host",{status:400});
 if(url.hostname==="unsplash.com"&&!/^\/photos\/[a-zA-Z0-9_-]+\/download$/.test(url.pathname))return new NextResponse("Unsupported image path",{status:400});
 const candidates=[url.toString()];

 for(const candidate of candidates){
  try{
   const response=await fetch(candidate,{redirect:"manual",signal:AbortSignal.timeout(6500),headers:{Accept:"image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8"}});
   const type=response.headers.get("content-type")||"";
   if(!response.ok||!type.startsWith("image/"))continue;
   const bytes=await response.arrayBuffer();
   if(bytes.byteLength<2000||bytes.byteLength>8_000_000)continue;
   return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800","X-Content-Type-Options":"nosniff"}});
  }catch{/* Try next safe source */}
 }
 return new NextResponse("Image unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
}
