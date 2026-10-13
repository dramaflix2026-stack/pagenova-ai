import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PublicForm from "@/components/forms/PublicForm";
import { getPublishedForm } from "@/lib/forms/server";

export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata> {
  const {id}=await params;
  const form=await getPublishedForm(id);
  return {title:form?.title||"Formulário indisponível",description:form?.description||"Formulário PageNova AI",
    robots:{index:false,follow:false}};
}
export default async function FormPublicPage({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const form=await getPublishedForm(id);
  if(!form)notFound();
  return <PublicForm form={form}/>;
}
