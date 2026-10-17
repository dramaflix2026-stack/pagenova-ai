"use client";
import {useEffect} from "react";
export function SetDocumentLanguage({language}:{language:"en"|"es"}){
 useEffect(()=>{
  const previous=document.documentElement.lang;
  document.documentElement.lang=language;
  return ()=>{document.documentElement.lang=previous||"pt-BR";};
 },[language]);
 return null;
}
