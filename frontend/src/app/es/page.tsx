import type {Metadata} from "next";
import { LandingRevamp } from "../teste/landing-revamp";
import {LocalizedMarketing} from "@/components/localized-marketing";
export const metadata:Metadata={
 title:"PageNova AI | Crea y publica tus ideas",
 description:"Crea sitios web, landing pages, cuestionarios, formularios y ebooks con IA. Prueba PageNova gratis.",
 alternates:{canonical:"/es",languages:{"pt-BR":"/","en":"/en","es":"/es"}}
};
export default function LocalizedHome(){return process.env.PAGENOVA_PUBLIC_LP === "v2" ? <LandingRevamp official initialLanguage="es" /> : <LocalizedMarketing lang="es"/>;}
