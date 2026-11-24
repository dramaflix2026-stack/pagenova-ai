import {NextRequest,NextResponse} from "next/server";

/**
 * Same-origin, allowlisted image gateway for the three TP4 physiotherapy templates.
 * Avoids hotlink/referrer restrictions in iframe previews and caches successful
 * image bytes at the CDN. Failed upstream responses are never cached.
 */
export const runtime="nodejs";
const ids=["20860594","31234755","29807423","20860624","20860590","20860580","20860616","20860593","20860618","20860584","20860582","27730554","14797757","5793695","7942574"] as const;
const verifiedUnsplash=[
 "https://images.unsplash.com/photo-1770219287080-9c73532fa878?auto=format&fit=crop&w=1200&q=80",
 "https://images.unsplash.com/photo-1764314138160-5f04f4a50dae?auto=format&fit=crop&w=1200&q=80"
];
export async function GET(request:NextRequest){
 const raw=request.nextUrl.searchParams.get("slot")||"";
 if(!/^\d{1,2}$/.test(raw))return new NextResponse("Invalid photo slot",{status:400});
 const slot=Number(raw);
 if(!Number.isInteger(slot)||slot<0||slot>=ids.length)return new NextResponse("Invalid photo slot",{status:400});
 const id=ids[slot];
 const sources=[
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`,
  verifiedUnsplash[slot%verifiedUnsplash.length],
  verifiedUnsplash[(slot+1)%verifiedUnsplash.length]
 ];
 for(const source of sources){
  try{
   const response=await fetch(source,{signal:AbortSignal.timeout(6500),headers:{Accept:"image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8", "User-Agent":"PageNovaAI/1.0 (editorial photo preview)"}});
   const type=response.headers.get("content-type")||"";
   if(!response.ok||!type.startsWith("image/"))continue;
   const bytes=await response.arrayBuffer();
   if(bytes.byteLength<2000||bytes.byteLength>8_000_000)continue;
   return new NextResponse(bytes,{status:200,headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800","X-Content-Type-Options":"nosniff"}});
  }catch{/* try next approved photo source */}
 }
 return new NextResponse("Photo temporarily unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
}
