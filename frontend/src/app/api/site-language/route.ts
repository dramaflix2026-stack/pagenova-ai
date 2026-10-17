import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
const languages=["pt","en","es"] as const;
type Language=typeof languages[number];
export async function GET(request:NextRequest){
 const lang=request.nextUrl.searchParams.get("lang");
 if(!lang||!languages.includes(lang as Language))return NextResponse.redirect(new URL("/",request.url));
 const path=lang==="pt"?"/":"/"+lang;
 const response=NextResponse.redirect(new URL(path,request.url),303);
 response.cookies.set("pagenova_site_lang",lang,{path:"/",sameSite:"lax",secure:request.nextUrl.protocol==="https:",httpOnly:true,maxAge:60*60*24*365});
 response.headers.set("Cache-Control","no-store");
 return response;
}