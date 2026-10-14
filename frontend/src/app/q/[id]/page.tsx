import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {quizAdmin,getPublicQuiz} from "@/lib/quizzes/server";
import {PublicQuizPlayer} from "@/components/quizzes/PublicQuizPlayer";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
  const {id}=await params;
  const quiz=await getPublicQuiz(quizAdmin(),id);
  return {title:quiz?.title||"Quiz indisponível",description:quiz?.subtitle||"Quiz criado com PageNova",
    robots:{index:false,follow:false}};
}
export default async function PublicQuizPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const quiz=await getPublicQuiz(quizAdmin(),id);
  if(!quiz)notFound();
  return <PublicQuizPlayer quiz={quiz}/>;
}