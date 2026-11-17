import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {builderV2PublishedStyleCss} from "../src/lib/builder-v2-published-style-parity.ts";

test("delivery 7: published CSS preserves scoped text, background, heading and CTA",()=>{
 const css=builderV2PublishedStyleCss({
   universalPrimaryCtaColor:"#BADA55",
   universalSectionStyles:{depoimentos:{textColor:"#F1F1F1",backgroundColor:"#232323",headingColor:"#AABBCC"}}
 });
 assert.match(css,/background-color:#232323!important/);
 assert.match(css,/color:#AABBCC!important/);
 assert.match(css,/text-fill-color:#F1F1F1!important/);
 assert.match(css,/background-color:#BADA55!important/);
 assert.match(css,/\[id\$="-reviews"\]/);
});
test("delivery 7: custom section alignment is published, not preview-only",()=>{
 const css=builderV2PublishedStyleCss({blocks:[{id:"card",section:"custom-journey",type:"paragraph",cardTitleAlign:"center"}]});
 assert.match(css,/custom-journey/);
 assert.match(css,/text-align:center!important/);
});
test("delivery 7: invalid section names or style values are excluded from CSS",()=>{
 const css=builderV2PublishedStyleCss({
  universalPrimaryCtaColor:"red;}body{display:none",
  universalSectionStyles:{"x\"];body{display:none":{backgroundColor:"#FFFFFF"},faq:{textColor:"var(--private);display:none"}}
 });
 assert.doesNotMatch(css,/display:none/);
 assert.equal(css,"");
});
test("delivery 7: published route consumes the common visual rules without mutating templates",()=>{
 const published=readFileSync(new URL("../src/app/site/[slug]/page.tsx",import.meta.url),"utf8");
 assert.match(published,/builderV2PublishedStyleCss\(publishedSite\)/);
 assert.match(published,/\{publicVisualCss&&<style>\{publicVisualCss\}<\/style>\}/);
});
