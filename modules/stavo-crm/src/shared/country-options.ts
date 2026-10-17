/**
 * Official ISO 3166-1 alpha-2 region identifiers, rendered in Portuguese
 * through built-in Intl rather than an API with per-request charges.
 * The value submitted to Google search remains the human-readable country.
 */
export const COUNTRY_CODES = (
 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ '+
 'BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ '+
 'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ '+
 'DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR '+
 'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY '+
 'HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP '+
 'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY '+
 'MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ '+
 'NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY '+
 'QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ '+
 'TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ '+
 'VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ') as readonly string[];

const countryFormatter = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
export function countryName(code: string): string {
  return countryFormatter.of(code.toUpperCase()) || code.toUpperCase();
}
const countryChoices = COUNTRY_CODES.map(code => ({code, name: countryName(code)}));
const byCountryName = new Map(countryChoices.map(x => [
  x.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(), x.code
]));
export function countryCodeForName(name: string): string | null {
  const key=name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(!key)return null;
  if(COUNTRY_CODES.includes(name.toUpperCase()))return name.toUpperCase();
  return byCountryName.get(key) || null;
}
const preferred = ['BR','US','PT','CA','MX','ES','AR','CL','CO','PE','GB','FR','DE','IT','AU','JP','IN'];
export const countryOptions = [
  ...preferred.map(code=>({code,name:countryName(code)})),
  ...countryChoices.filter(x=>!preferred.includes(x.code)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
] as const;

/**
 * A practical set of cities users most commonly search. These are suggestions,
 * not an exhaustive city directory. The "Outra cidade" input accepts any city.
 * No Google API charge is incurred merely by selecting a city.
 */
const popularCities: Record<string,string[]> = {
 US:['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Miami','Orlando','Tampa','Boston','Seattle','San Francisco','Las Vegas','Atlanta','Denver','Austin','Washington'],
 PT:['Lisboa','Porto','Braga','Coimbra','Faro','Aveiro','Setúbal','Cascais','Sintra','Leiria','Funchal'],
 CA:['Toronto','Vancouver','Montreal','Ottawa','Calgary','Edmonton','Quebec City','Winnipeg'],
 MX:['Ciudad de México','Guadalajara','Monterrey','Puebla','Tijuana','Cancún','Mérida','Querétaro'],
 ES:['Madrid','Barcelona','Valência','Sevilha','Málaga','Bilbao','Zaragoza','Granada','Alicante'],
 AR:['Buenos Aires','Córdoba','Rosario','Mendoza','La Plata','Mar del Plata','Salta'],
 CL:['Santiago','Valparaíso','Viña del Mar','Concepción','La Serena','Antofagasta'],
 CO:['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga'],
 PE:['Lima','Arequipa','Trujillo','Cusco','Chiclayo','Piura'],
 GB:['Londres','Manchester','Birmingham','Liverpool','Leeds','Bristol','Edimburgo','Glasgow'],
 FR:['Paris','Marselha','Lyon','Toulouse','Nice','Bordeaux','Lille'],
 DE:['Berlim','Hamburgo','Munique','Colônia','Frankfurt','Stuttgart','Düsseldorf'],
 IT:['Roma','Milão','Nápoles','Turim','Florença','Bolonha','Veneza'],
 AU:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Canberra'],
 JP:['Tóquio','Osaka','Kyoto','Yokohama','Nagoya','Sapporo','Fukuoka'],
 IN:['Mumbai','Nova Délhi','Bengaluru','Hyderabad','Chennai','Pune','Jaipur'],
};
export function citySuggestions(country: string): readonly string[] {
  const code=countryCodeForName(country);
  return code ? popularCities[code] || [] : [];
}
