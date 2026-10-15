/** Small dependency-free ZIP exporter for AI-produced text source files.
 * Implements ZIP STORE with CRC32. No executable project content is run.
 */
type SourceFile={path:string;content:string};
function crc32(bytes:Uint8Array):number{
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^(-(crc&1)&0xedb88320);}
 return (crc^0xffffffff)>>>0;
}
export function sourceZip(files:SourceFile[]):Blob{
 const encoder=new TextEncoder();
 const parts:Uint8Array[]=[];
 const central:Uint8Array[]=[];
 let offset=0;
 const write=(data:Uint8Array,pos:number,size:number,value:number)=>{
   const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
   if(size===2)view.setUint16(pos,value,true);else view.setUint32(pos,value,true);
 };
 for(const file of files){
   const filename=encoder.encode(file.path);
   const contents=encoder.encode(file.content);
   const crc=crc32(contents);
   const local=new Uint8Array(30+filename.length);
   write(local,0,4,0x04034b50);write(local,4,2,20);
   write(local,6,2,0x0800);write(local,8,2,0);
   write(local,14,4,crc);write(local,18,4,contents.length);write(local,22,4,contents.length);
   write(local,26,2,filename.length);local.set(filename,30);
   parts.push(local,contents);
   const index=new Uint8Array(46+filename.length);
   write(index,0,4,0x02014b50);write(index,4,2,20);write(index,6,2,20);
   write(index,8,2,0x0800);write(index,10,2,0);
   write(index,16,4,crc);write(index,20,4,contents.length);write(index,24,4,contents.length);
   write(index,28,2,filename.length);write(index,42,4,offset);
   index.set(filename,46);central.push(index);
   offset+=local.length+contents.length;
 }
 const directoryLength=central.reduce((sum,x)=>sum+x.length,0);
 const end=new Uint8Array(22);
 write(end,0,4,0x06054b50);write(end,8,2,files.length);write(end,10,2,files.length);
 write(end,12,4,directoryLength);write(end,16,4,offset);
 return new Blob([...parts,...central,end] as BlobPart[],{type:"application/zip"});
}
