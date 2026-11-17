"use client";

import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";

/** Customer view defaults to closed. Admin visibility is granted only by
 * an authenticated server response, not a browser-supplied email or flag. */
export function useBuilderV2InternalLearningAccess(){
  const [enabled,setEnabled]=useState(false);
  useEffect(()=>{
    let active=true;
    let generation=0;
    const supabase=createClient();
    const verify=async()=>{
      const current=++generation;
      if(active)setEnabled(false);
      try{
        const response=await fetch("/api/builder-v2/internal-learning-access",{
          cache:"no-store",credentials:"same-origin"
        });
        const result:unknown=response.ok?await response.json():null;
        if(active&&current===generation){
          setEnabled(response.ok&&!!result&&typeof result==="object"&&
            "enabled" in result&&result.enabled===true);
        }
      }catch{
        if(active&&current===generation)setEnabled(false);
      }
    };
    void verify();
    const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
      if(event==="SIGNED_OUT"||event==="SIGNED_IN"||event==="USER_UPDATED"){
        // Revoke visibility immediately on account switch; recheck server.
        setEnabled(false);
        void verify();
      }
    });
    return()=>{active=false;generation++;subscription.unsubscribe()};
  },[]);
  return enabled;
}
