/** Owner-side CSV export with Excel-safe escaping and UTF-8 BOM. */
export function downloadStudioCsv(filename:string,headers:string[],rows:unknown[][]):void{
 const encode=(value:unknown):string=>{
  const valueString=String(value??"").replace(/\r\n?/g,"\n");
  const neutral=/^[\t\r\n ]*[=+\-@]/.test(valueString)?"'"+valueString:valueString;
  return '"'+neutral.replace(/"/g,'""')+'"';
 };
 const csv="\uFEFF"+[headers,...rows.map(row=>row.map(value=>String(value??"")))].map(cols=>cols.map(encode).join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=filename.replace(/[^a-z0-9_.-]/gi,"_")||"respostas.csv";
 document.body.appendChild(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
