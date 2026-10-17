/**
 * Google Places uses ISO 3166-1 alpha-2 regionCode and BCP-47 languageCode.
 * Keep country names editable: unrecognized countries never get an accidental
 * Brazil bias. We also accept ISO codes for internationally minded users.
 */
export type PlacesLocale={regionCode?:string;languageCode:string};
const countries:ReadonlyArray<readonly [string,string,string]>= [
 ["Brasil","BR","pt-BR"],["Brazil","BR","pt-BR"],
 ["Portugal","PT","pt-PT"],["Estados Unidos","US","en"],["United States","US","en"],
 ["USA","US","en"],["EUA","US","en"],["Canada","CA","en"],["Canadá","CA","en"],
 ["México","MX","es"],["Mexico","MX","es"],["Espanha","ES","es"],["Spain","ES","es"],
 ["Argentina","AR","es"],["Chile","CL","es"],["Colômbia","CO","es"],["Colombia","CO","es"],
 ["Peru","PE","es"],["Uruguai","UY","es"],["Uruguay","UY","es"],
 ["Paraguai","PY","es"],["Paraguay","PY","es"],["Bolívia","BO","es"],["Bolivia","BO","es"],
 ["Equador","EC","es"],["Ecuador","EC","es"],["Costa Rica","CR","es"],
 ["Reino Unido","GB","en"],["United Kingdom","GB","en"],["UK","GB","en"],
 ["Irlanda","IE","en"],["Ireland","IE","en"],
 ["França","FR","fr"],["France","FR","fr"],["Alemanha","DE","de"],["Germany","DE","de"],
 ["Itália","IT","it"],["Italy","IT","it"],["Holanda","NL","nl"],["Netherlands","NL","nl"],
 ["Bélgica","BE","nl"],["Belgium","BE","nl"],["Suíça","CH","de"],["Switzerland","CH","de"],
 ["Austrália","AU","en"],["Australia","AU","en"],
 ["Japão","JP","ja"],["Japan","JP","ja"],["Índia","IN","en"],["India","IN","en"],
 ["África do Sul","ZA","en"],["South Africa","ZA","en"],
 ["Emirados Árabes Unidos","AE","en"],["United Arab Emirates","AE","en"],
];
const normalize=(v:string)=>v.trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const byName=new Map(countries.map(([name,regionCode,languageCode])=>[normalize(name),{regionCode,languageCode}]));
const byCode=new Map(countries.map(([,regionCode,languageCode])=>[regionCode,{regionCode,languageCode}]));
export function resolvePlacesLocale(country:string|null|undefined,defaultLanguage="pt-BR",defaultRegion="BR"):PlacesLocale{
 const name=(country||"").trim();
 if(!name)return {languageCode:defaultLanguage,regionCode:defaultRegion};
 const known=byName.get(normalize(name))||byCode.get(name.toUpperCase());
 if(known)return known;
 // Unknown free-form countries should rely on their text in the query,
 // rather than falsely requesting results biased toward Brazil.
 return {languageCode:"en"};
}
export const suggestedCountries=[
 "Brasil","Estados Unidos","Portugal","Canadá","México","Espanha",
 "Argentina","Chile","Colômbia","Peru","Reino Unido","França",
 "Alemanha","Itália","Austrália","Japão","Índia"
] as const;
