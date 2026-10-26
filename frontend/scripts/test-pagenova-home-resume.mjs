import test from "node:test";
import assert from "node:assert/strict";
import {resolvePageNovaContinueHref} from "../src/lib/pagenova-continue-project.ts";

const root="pagenova-builder-v2-private-v1";
const crmId="01KRMCRMPROJECT000000000001";
const storage=(entries={})=>{
 const names=Object.keys(entries);
 return {length:names.length,key:(i)=>names[i]??null,getItem:(key)=>entries[key]??null};
};
const draft=(n=1)=>JSON.stringify({id:"site-1",blocks:Array.from({length:n},(_,i)=>({id:String(i)}))});

test("No draft opens existing Meus Sites projects",()=>{
 assert.equal(resolvePageNovaContinueHref(storage()),"/app/paginas");
 assert.equal(resolvePageNovaContinueHref(storage({[root]:draft(0)})),"/app/paginas");
});
test("Studio draft resumes in original Builder 2.0",()=>{
 assert.equal(resolvePageNovaContinueHref(storage({[root]:draft()})),"/app/builder-v2");
});
test("CRM draft resumes its saved lead workspace",()=>{
 const key=root+":crm:"+crmId;
 assert.equal(resolvePageNovaContinueHref(storage({[key]:draft()})),
    "/app/builder-v2?crmProject="+crmId);
});
test("Standalone Studio draft has priority over CRM draft",()=>{
 const key=root+":crm:"+crmId;
 assert.equal(resolvePageNovaContinueHref(storage({[key]:draft(),[root]:draft()})),"/app/builder-v2");
});
test("Corrupt, unrelated and history-only values do not create deep links",()=>{
 const values={"pagenova-other-key":draft(),
  [root]:"not JSON",
  [root+":crm:bad"]:draft(),
  [root+":crm:"+crmId+":versions"]:draft()};
 assert.equal(resolvePageNovaContinueHref(storage(values)),"/app/paginas");
});
