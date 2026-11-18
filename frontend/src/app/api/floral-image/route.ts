import {NextRequest,NextResponse} from "next/server";

export const runtime="nodejs";
const idPattern=/^photo-\d{10,15}-[a-z0-9]{8,20}$/i;
const allowedWidths=new Set(["160","640","960","1200","1600"]);
export async function GET(request:NextRequest){
 const id=request.nextUrl.searchParams.get("id")||"";
 const provider=request.nextUrl.searchParams.get("provider")||"unsplash";
 const width=request.nextUrl.searchParams.get("w")||"960";
 if(!(provider==="unsplash"&&idPattern.test(id)||provider==="pexels"&&/^\d{5,12}$/.test(id))||!allowedWidths.has(width))return new NextResponse("Invalid image",{status:400});
 const source=new URL(provider==="pexels"?"https://images.pexels.com/photos/"+id+"/pexels-photo-"+id+".jpeg":"https://images.unsplash.com/"+id);
 source.searchParams.set("auto",provider==="pexels"?"compress":"format");
 source.searchParams.set("fit","crop");
 source.searchParams.set("w",width);
 source.searchParams.set("q","80");
 try{
  const response=await fetch(source.toString(),{signal:AbortSignal.timeout(12000),next:{revalidate:86400}});
  if(!response.ok)return new NextResponse("Image unavailable",{status:502});
  const type=response.headers.get("content-type")||"";
  if(!type.startsWith("image/"))return new NextResponse("Invalid upstream content",{status:502});
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength>8_000_000)return new NextResponse("Image too large",{status:502});
  return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400","X-Content-Type-Options":"nosniff"}});
 }catch{return new NextResponse("Image temporarily unavailable",{status:502});}
}
