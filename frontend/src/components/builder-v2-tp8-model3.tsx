"use client";
import {Template8HospitalityHero} from "./template8-hospitality-hero";
import {Template8HospitalitySections} from "./template8-hospitality-sections";
import {Template8HospitalityDiscover} from "./template8-hospitality-discover";
import {Template8HospitalityJourney} from "./template8-hospitality-journey";
import {Template8HospitalityClosing} from "./template8-hospitality-closing";
import "./builder-v2-tp8-model3.css";
type Props={brand:string;niche:string;headline?:string;description?:string;image?:string;contactHref?:string;address?:string;email?:string;whatsapp?:string};
export function BuilderV2TP8Model3({brand,niche,headline,description,image,contactHref,address,email,whatsapp}:Props){
 return <div className="pn-t8-model3" data-tp8-model="03">
 <Template8HospitalityHero brand={brand} niche={niche} headline={headline} description={description} image={image} contactHref={contactHref}/>
 <Template8HospitalitySections brand={brand} niche={niche} contactHref={contactHref}/>
 <Template8HospitalityDiscover brand={brand} niche={niche} contactHref={contactHref}/>
 <Template8HospitalityJourney brand={brand} niche={niche} contactHref={contactHref}/>
 <Template8HospitalityClosing brand={brand} niche={niche} address={address} email={email} whatsapp={whatsapp} contactHref={contactHref}/>
 </div>;
}
