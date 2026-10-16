// @ts-nocheck
import {createHmac,timingSafeEqual} from "node:crypto";

function secret():string{
 return process.env.PAGENOVA_CLONER_MEDIA_SECRET||process.env.SUPABASE_SECRET_KEY||"";
}
function digest(url:string,key:string):string{
 return createHmac("sha256",key).update("pagenova-public-clone-media-v1\n"+url).digest("hex");
}
/** Signed proxy URL is bound to a single immutable public HTTPS resource. */
export function signedClonerMedia(url:string):string{
 const key=secret();
 if(!key||url.length>1800||!/^https:\/\//i.test(url))return url;
 return "/api/cloner/media?u="+encodeURIComponent(url)+"&sig="+digest(url,key);
}
export function verifyClonerMedia(url:string,signature:string):boolean{
 const key=secret();
 if(!key||url.length>1800||!/^https:\/\//i.test(url)||!/^[a-f0-9]{64}$/.test(signature))return false;
 const expected=Buffer.from(digest(url,key),"hex"),actual=Buffer.from(signature,"hex");
 return expected.length===actual.length&&timingSafeEqual(expected,actual);
}
