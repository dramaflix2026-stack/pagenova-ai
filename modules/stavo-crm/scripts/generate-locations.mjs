/**
 * Gera src/server/data/br-locations.ts a partir da API oficial do IBGE.
 *
 * O resultado e commitado no repositorio de proposito: o build da hospedagem
 * NAO depende de rede, e a lista de municipios muda muito raramente.
 *
 * Para atualizar:
 *   node scripts/generate-locations.mjs
 *
 * Fonte: https://servicodados.ibge.gov.br/api/docs/localidades
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'src', 'server', 'data', 'br-locations.ts');

const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
const URL_MUNICIPIOS =
  'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome';

/** O IBGE mudou o formato ao longo do tempo; os dois caminhos sao aceitos. */
function siglaDoMunicipio(municipio) {
  return (
    municipio?.microrregiao?.mesorregiao?.UF?.sigla ??
    municipio?.['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla ??
    null
  );
}

async function baixar(url) {
  const resposta = await fetch(url, { headers: { accept: 'application/json' } });
  if (!resposta.ok) {
    throw new Error(`Falha ao baixar ${url}: HTTP ${resposta.status}`);
  }
  return resposta.json();
}

const [estados, municipios] = await Promise.all([baixar(URL_ESTADOS), baixar(URL_MUNICIPIOS)]);

if (estados.length !== 27) {
  throw new Error(`Esperado 27 unidades federativas, recebido ${estados.length}.`);
}

const porUf = new Map(estados.map((estado) => [estado.sigla, []]));
let semUf = 0;

for (const municipio of municipios) {
  const sigla = siglaDoMunicipio(municipio);
  if (!sigla || !porUf.has(sigla)) {
    semUf += 1;
    continue;
  }
  porUf.get(sigla).push(municipio.nome);
}

if (semUf > 0) {
  throw new Error(`${semUf} municipios sem UF identificavel. O formato do IBGE mudou.`);
}

// Ordenacao em portugues: acentos nao podem jogar "Ãgua" para o fim da lista.
const colator = new Intl.Collator('pt-BR');
for (const lista of porUf.values()) lista.sort(colator.compare);

const totalMunicipios = [...porUf.values()].reduce((soma, lista) => soma + lista.length, 0);
if (totalMunicipios < 5500) {
  throw new Error(`Apenas ${totalMunicipios} municipios. A resposta veio incompleta.`);
}

const aspas = (texto) => `'${texto.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const linhasEstados = estados
  .slice()
  .sort((a, b) => colator.compare(a.nome, b.nome))
  .map((estado) => `  { uf: '${estado.sigla}', nome: ${aspas(estado.nome)} },`)
  .join('\n');

const linhasCidades = [...porUf.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(
    ([uf, lista]) => `  ${uf}: [\n${lista.map((nome) => `    ${aspas(nome)},`).join('\n')}\n  ],`,
  )
  .join('\n');

const conteudo = `/**
 * Unidades federativas e municipios do Brasil.
 *
 * ARQUIVO GERADO -- nao edite a mao.
 * Regenerar com: node scripts/generate-locations.mjs
 *
 * Fonte: IBGE (servicodados.ibge.gov.br/api/docs/localidades)
 * Gerado em: ${new Date().toISOString().slice(0, 10)}
 * Total: ${estados.length} unidades federativas, ${totalMunicipios} municipios.
 */

export interface UnidadeFederativa {
  uf: string;
  nome: string;
}

/** Ordenadas pelo nome, como aparecem para quem escolhe. */
export const ESTADOS: readonly UnidadeFederativa[] = [
${linhasEstados}
];

/** Municipios por sigla da UF, ja ordenados em portugues. */
export const CIDADES_POR_UF: Readonly<Record<string, readonly string[]>> = {
${linhasCidades}
};
`;

writeFileSync(DESTINO, conteudo, 'utf8');
console.log(
  `Gerado ${path.relative(RAIZ, DESTINO)}: ${estados.length} UFs, ${totalMunicipios} municipios.`,
);
