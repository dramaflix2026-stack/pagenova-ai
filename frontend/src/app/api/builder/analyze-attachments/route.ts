import { NextRequest } from "next/server";
import { authorizedForms, FormServiceError, errorsAsResponse } from "@/lib/forms/server";
import { reservePaidAiBudget } from "@/lib/paid-ai-budget";

export const runtime="nodejs";
export const maxDuration=60;

/** Optional analysis BEFORE the paid site-generation request.
 * Images/PDFs are summarized as visual references in the user's prompt.
 * Original bytes never go through CRM / are not stored here.
 */
export async function POST(request:NextRequest){
  try{
    const access = await authorizedForms();
    const origin=request.headers.get("origin");
    if(origin&&origin!==request.nextUrl.origin)throw new FormServiceError("Origem não autorizada.",403);
    const data=await request.formData();
    const files=data.getAll("files").filter((item):item is File=>item instanceof File);
    if(!files.length||files.length>3)throw new FormServiceError("Anexe de 1 a 3 arquivos.");
    const supported=new Set(["image/png","image/jpeg","image/webp","application/pdf","text/plain"]);
    if(data.get("mode")==="local"){
      // Studio no-API modules send this explicit mode. It never reaches
      // OpenAI. Text files are read locally; images/video frames/PDF have
      // their names and MIME types recorded, not falsely "vision analyzed".
      let bytes=0;
      const refs:string[]=[];
      for(const file of files){
        bytes+=file.size;
        if(!supported.has(file.type)||file.size<1||file.size>5*1024*1024||bytes>9*1024*1024)
          throw new FormServiceError("Arquivo não suportado ou maior que o limite de 5 MB.",413);
        refs.push(file.type==="text/plain"?
          "Arquivo de texto "+file.name+": "+(await file.text()).slice(0,7000):
          "Referência anexada "+file.name+" ("+file.type+"). O conteúdo visual não foi interpretado no modo sem IA; peça ao usuário para descrever seus detalhes.");
      }
      return Response.json({summary:refs.join("\\n").slice(0,12000),files:files.map(f=>f.name),engine:"local-file-descriptor",paidApiCalls:0},
        {headers:{"Cache-Control":"no-store"}});
    }
    if(data.get("mode")!=="site"){
      throw new FormServiceError("Modo de análise de anexos não autorizado.",400);
    }
    let total=0;
    const content:Array<{type:string;[key:string]:unknown}>=[{
      type:"input_text",
      text:"Analise os anexos para compor um briefing de criação de site. Descreva design, cores, layout, fotografias, elementos, nomes e dados que apareçam, quando relevantes. Não invente serviços, provas sociais ou conteúdo não fornecido. Responda em português brasileiro com no máximo 1.500 caracteres. Não copie textos extensos. Distingua imagens visuais de requisitos textuais. Se houver logo, descreva cores, símbolo e texto exato.",
    }];
    const filenames:string[]=[];
    for(const file of files){
      total+=file.size;
      if(!supported.has(file.type)||file.size<1||file.size>5*1024*1024||total>9*1024*1024)
        throw new FormServiceError("Use imagens PNG/JPG/WebP, PDF ou TXT de até 5 MB cada (máximo 9 MB no total).");
      filenames.push(file.name.slice(0,100));
      if(file.type==="text/plain"){
        content.push({type:"input_text",text:"Texto de "+file.name+":\n"+(await file.text()).slice(0,12000)});
      }else{
        const b=Buffer.from(await file.arrayBuffer()).toString("base64");
        const uri="data:"+file.type+";base64,"+b;
        if(file.type==="application/pdf")
          content.push({type:"input_file",filename:file.name.slice(0,100)||"referencia.pdf",file_data:uri});
        else content.push({type:"input_image",image_url:uri});
      }
    }
    if(content.every(item=>item.type==="input_text")){
      // Text-only descriptions need no paid model call.
      return Response.json({summary:content.slice(1).map(v=>String(v.text)).join("\n").slice(0,4000),files:filenames});
    }
    const key=process.env.OPENAI_API_KEY;
    if(!key)throw new FormServiceError("Análise de anexos por IA não configurada.",503);
    const aiBudget = await reservePaidAiBudget(access.admin, access.userId, "site_attachment_analysis");
    if (!aiBudget.ok) throw new FormServiceError(aiBudget.message, aiBudget.status);
    const response=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},
      body:JSON.stringify({
        model:process.env.PAGENOVA_FORMS_MODEL||"gpt-4.1-mini",
        input:[{role:"user",content}],
        max_output_tokens:550,store:false,
      }),
      signal:AbortSignal.timeout(48000),
    });
    const result=await response.json().catch(()=>({})) as {
      output_text?:string;
      output?:Array<{content?:Array<{type?:string;text?:string}>}>;
      error?:{message?:string};
    };
    if(!response.ok)throw new FormServiceError("Falha ao analisar os anexos: "+(result.error?.message||"Tente novamente."),502);
    const summary=(result.output_text||
      result.output?.flatMap(entry=>entry.content||[]).filter(part=>part.type==="output_text")
        .map(part=>part.text||"").join("\n")||"").trim();
    if(!summary)throw new FormServiceError("A IA não conseguiu interpretar os arquivos.",502);
    return Response.json({summary:summary.slice(0,4000),files:filenames},{
      headers:{"Cache-Control":"no-store"},
    });
  }catch(error){return errorsAsResponse(error);}
}
