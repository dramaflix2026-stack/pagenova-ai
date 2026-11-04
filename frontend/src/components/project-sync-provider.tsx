"use client";
import {useEffect} from "react";
import {startProjectSync} from "@/lib/project-sync";
export function ProjectSyncProvider({userId}:{userId:string}){
  useEffect(()=>startProjectSync(userId),[userId]);
  return null;
}
