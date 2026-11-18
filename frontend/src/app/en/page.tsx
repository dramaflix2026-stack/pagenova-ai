import { LandingShell } from "../teste/landing-shell";
import type {Metadata} from "next";
import { LandingRevamp } from "../teste/landing-revamp";
import {LocalizedMarketing} from "@/components/localized-marketing";
export const metadata:Metadata={
 title:"PageNova AI | Build and launch your ideas",
 description:"Create websites, landing pages, quizzes, forms and ebooks with AI. Explore PageNova and start a free trial.",
 alternates:{canonical:"/en",languages:{"pt-BR":"/","en":"/en","es":"/es"}}
};
export default function LocalizedHome(){return process.env.PAGENOVA_PUBLIC_LP === "v2" ? <LandingShell><LandingRevamp official initialLanguage="en" /></LandingShell> : <LocalizedMarketing lang="en"/>;}
