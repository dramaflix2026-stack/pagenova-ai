/**
 * Deterministic editorial intent + cookbook writer. Zero billable API calls.
 * Exact requested number of recipes, with distinct measured ingredients,
 * method, preparation time and servings. Refuses requirements the curated
 * catalog cannot satisfy instead of silently fabricating them.
 */
import {normalizeEbook,type EbookProject,type EbookPage,type EbookTheme} from "./schema";
import {RECIPE_CATALOG,RECIPE_SECTION_LABELS,type Recipe} from "./recipe-library";

export type EbookIntent =
  | {kind:"cookbook"; requestedItems:number; topic:string; dietaryNotes:string[]}
  | {kind:"general"; requestedItems:null; topic:string; dietaryNotes:[]};

const simplify=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function detectEbookIntent(prompt:string):EbookIntent{
  const s=simplify(prompt);
  const recipeRequest=/\b(receita|receitas|pratos culinarios|livro de receitas|cardapio de receitas)\b/.test(s);
  if(!recipeRequest)return {kind:"general",requestedItems:null,topic:prompt.trim(),dietaryNotes:[]};
  const numeric=/(?:\b(\d{1,3})\s*(?:receitas|pratos)\b|\b(?:receitas|pratos)\s*(?:de|com)?\s*(\d{1,3})\b)/.exec(s);
  const quantity=numeric?Number(numeric[1]||numeric[2]):20;
  if(!Number.isInteger(quantity)||quantity<1||quantity>50){
    throw new Error("O acervo culinário local suporta de 1 a 50 receitas completas. Ajuste a quantidade antes de gerar.");
  }
  const dietaryNotes:string[]=[];
  // This curated catalog contains wheat, eggs, nuts, dairy and fish. Never
  // mislabel it as vegan, allergy-safe, or a medically restricted diet.
  const restricted=[
    [/\b(vegano|vegana|veganas|veganos)\b/,"veganas"],
    [/\b(vegetariano|vegetariana|vegetarianas|vegetarianos)\b/,"vegetarianas"],
    [/\b(sem gluten|celiaco|celiaca)\b/,"sem glúten"],
    [/\b(sem lactose|intolerancia a lactose)\b/,"sem lactose"],
    [/\b(cetogenica|keto|low carb)\b/,"cetogênicas ou low carb"],
    [/\b(sem ovos|sem ovo|sem oleaginosas|sem amendoim)\b/,"sem alergênicos específicos"]
  ] as const;
  for(const [re,description] of restricted)if(re.test(s))dietaryNotes.push(description);
  if(dietaryNotes.length)throw new Error(
    "Este acervo gratuito ainda não foi validado para receitas "+dietaryNotes.join(", ")+
    ". Para não entregar receitas incompatíveis, escolha receitas saudáveis variadas sem essas restrições."
  );
  return {kind:"cookbook",requestedItems:quantity,topic:prompt.trim(),dietaryNotes};
}

function pickRecipes(total:number):Recipe[]{
  const groups:Recipe["category"][]=["cafe","almoco","jantar","lanche","sobremesa"];
  const buckets=groups.map(category=>RECIPE_CATALOG.filter(recipe=>recipe.category===category));
  const picked:Recipe[]=[];
  let step=0;
  while(picked.length<total){
    const index=step%groups.length;
    if(buckets[index].length)picked.push(buckets[index].shift()!);
    step++;
    if(step>1000)throw new Error("Acervo de receitas insuficiente.");
  }
  // Display by meal type for a readable table of contents.
  return picked.sort((a,b)=>groups.indexOf(a.category)-groups.indexOf(b.category));
}

function numberedPage(index:number,kind:EbookPage["kind"],eyebrow:string,title:string,lead:string,body:string,bullets:string[],imagePrompt=""):EbookPage{
  return {id:"ebook-page-"+index,kind,eyebrow,title,lead,body,bullets,imagePrompt,imageUrl:"",imageCredit:""};
}

export function buildCookbook(input:{
  prompt:string;count:number;author:string;theme:EbookTheme;imageMode:"web"|"none";
}):EbookProject{
  const recipes=pickRecipes(input.count);
  if(recipes.length!==input.count||new Set(recipes.map(r=>r.title)).size!==input.count)throw new Error("Não foi possível produzir a quantidade solicitada.");
  const title=input.count+" receitas saudáveis para o dia a dia";
  const categoryGroups=[...new Set(recipes.map(r=>r.category))];
  const cover=numberedPage(0,"cover","LIVRO DE RECEITAS",title,
    "Receitas completas, com medidas, rendimento, tempo e modo de preparo.",
    "Sugestões culinárias para compor refeições variadas.",[],
    "Comida caseira saudável, ingredientes frescos, pratos brasileiros");
  const intro=numberedPage(1,"feature","ANTES DE COZINHAR","Como usar este livro",
    input.count+" receitas significam "+input.count+" preparos diferentes — não "+input.count+" tópicos genéricos.",
    "Escolha a refeição pelo momento do dia. Em cada receita, confira a lista de ingredientes, separe os utensílios e siga as etapas na ordem indicada.\n\n"+
    "Os tempos são aproximados e podem variar conforme os equipamentos e o tamanho dos ingredientes. Higienize frutas, verduras e utensílios, mantenha alimentos perecíveis refrigerados e cozinhe carnes e ovos completamente.\n\n"+
    "As receitas não têm cálculo nutricional individual nem prometem emagrecimento. Ajustes para alergias e condições de saúde exigem orientação apropriada.",
    ["Ingredientes com quantidades","Passo a passo executável","Rendimento e tempo aproximados","Organização por tipo de refeição"]);
  const contents=numberedPage(2,"chapter","ÍNDICE DE RECEITAS","Escolha sua próxima refeição",
    "As "+input.count+" receitas estão organizadas em cinco grupos.",
    categoryGroups.map(category=>{
      const count=recipes.filter(recipe=>recipe.category===category).length;
      return RECIPE_SECTION_LABELS[category]+": "+count+" receita"+(count>1?"s":"");
    }).join("\n\n"),
    categoryGroups.map(category=>RECIPE_SECTION_LABELS[category]+": "+recipes.filter(recipe=>recipe.category===category).length+" receitas"));
  const contentPages=recipes.map((recipe,i)=>{
    const number=String(i+1).padStart(2,"0");
    const category=RECIPE_SECTION_LABELS[recipe.category];
    return numberedPage(i+3,"recipe",category.toUpperCase()+" · RECEITA "+number,
      recipe.title,
      "Rendimento: "+recipe.servings+" porç"+(recipe.servings===1?"ão":"ões")+"  •  Tempo aproximado: "+recipe.minutes+" min",
      recipe.steps.map((step,j)=>(j+1)+". "+step).join("\n"),
      recipe.ingredients,
      // Suppress automatic Commons search: only use photos provided by the author
      // for these structured recipes. Generic stock matches are unacceptable.
      recipe.title+" pronto, fotografia culinária do prato");
  });
  const closing=numberedPage(contentPages.length+3,"back","COZINHA EM CASA","Agora é sua vez de preparar",
    input.count+" receitas com ingredientes e passos completos.",
    "Escolha algumas receitas para testar durante a semana, liste os ingredientes e organize a preparação de acordo com a sua rotina.\n\n"+
    "O valor de um livro de receitas está na possibilidade de cozinhar, ajustar o tempero e compartilhar boas refeições. Bom preparo!",
    ["Escolha suas favoritas","Confira ingredientes e porções","Prepare seguindo cada etapa"]);
  const ebook=normalizeEbook({
    id:crypto.randomUUID(),title,subtitle:"Do café da manhã à sobremesa · "+input.count+" receitas com modo de preparo",
    author:input.author||"Seu nome ou marca",audience:"Pessoas interessadas em refeições caseiras variadas",
    prompt:input.prompt,theme:input.theme,imageMode:input.imageMode,
    pages:[cover,intro,contents,...contentPages,closing],updatedAt:new Date().toISOString()
  });
  const actual=ebook.pages.filter(p=>p.kind==="recipe");
  if(actual.length!==input.count||actual.some(p=>p.bullets.length<3||p.body.split("\n").length<3)){
    throw new Error("Falha na validação editorial: há receitas incompletas.");
  }
  return ebook;
}