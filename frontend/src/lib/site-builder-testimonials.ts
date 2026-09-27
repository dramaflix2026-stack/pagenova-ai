type Example = { name: string; city: string; quote: string };

const names = [
  "Marina Costa", "Rafael Almeida", "Camila Ribeiro", "Lucas Ferreira", "Beatriz Martins",
  "Daniel Oliveira", "Juliana Carvalho", "André Souza", "Fernanda Lima", "Pedro Barbosa",
  "Isabela Rocha", "Gustavo Nogueira", "Larissa Mendes", "Thiago Azevedo", "Renata Castro",
  "Bruno Teixeira", "Patrícia Dias", "Felipe Correia", "Ana Paula Melo", "Vinícius Lopes",
  "Clara Cardoso", "Eduardo Moreira", "Sofia Pereira", "Marcelo Cunha", "Letícia Gomes",
];

const cities = [
  "São Paulo, SP", "Curitiba, PR", "Belo Horizonte, MG", "Recife, PE",
  "Porto Alegre, RS", "Campinas, SP", "Salvador, BA", "Florianópolis, SC",
  "Rio de Janeiro, RJ", "Fortaleza, CE",
];

const quotes = [
  "Encontrei as informações de que precisava e consegui entender como funciona o atendimento.",
  "A apresentação foi clara e me ajudou a conhecer melhor a proposta antes de entrar em contato.",
  "Gostei de poder conhecer os serviços e esclarecer minhas primeiras dúvidas com facilidade.",
  "O site tornou simples o primeiro passo para conversar sobre o que eu procurava.",
  "As informações estão organizadas e o contato ficou fácil de encontrar.",
  "Foi bom entender a forma de trabalho antes de enviar minha mensagem.",
  "Consegui navegar pelas opções e encontrar o caminho que fazia sentido para mim.",
  "A experiência de leitura foi agradável e o formulário deixou o próximo passo claro.",
  "Pude conhecer a proposta no meu tempo e depois decidir entrar em contato.",
  "Tudo ficou acessível: apresentação, serviços e uma forma direta de conversar.",
  "A página explicou o essencial sem dificultar a navegação.",
  "Encontrei respostas para minhas dúvidas iniciais e soube como continuar.",
  "A organização do site facilitou bastante a busca pelas informações.",
  "Foi fácil descobrir quais opções estavam disponíveis e como pedir mais detalhes.",
  "Gostei da clareza da apresentação e da simplicidade do contato.",
  "As etapas ficaram compreensíveis desde a primeira visita ao site.",
  "Consegui comparar as informações e me senti confortável para fazer uma pergunta.",
  "A navegação me ajudou a entender melhor o que poderia esperar do atendimento.",
  "O conteúdo foi objetivo e mostrou claramente como iniciar uma conversa.",
  "Achei o formulário rapidamente e pude explicar o que estava buscando.",
  "A estrutura da página facilitou encontrar os pontos mais importantes para mim.",
  "Consegui conhecer a proposta com calma e localizar os meios de contato.",
  "O site apresentou os serviços de um jeito direto e fácil de acompanhar.",
  "Foi simples entender a proposta e seguir até a área de contato.",
  "A experiência me deu uma visão clara antes de fazer meu primeiro contato.",
];

const examples: Example[] = names.map((name, index) => ({
  name,
  city: cities[index % cities.length],
  quote: quotes[index],
}));

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);

function avatar(index: number): string {
  const x = (index % 5) * 25;
  const y = Math.floor(index / 5) * 25;
  return `<span class="example-avatar" role="img" aria-label="Retrato sintético de personagem fictício" style="background-position:${x}% ${y}%"></span>`;
}

export function renderExampleTestimonials(): string {
  const cards = examples.map(({ name, city, quote }, index) =>
    `<article class="example-review"><span class="example-tag">Exemplo fictício</span><p>“${escapeHtml(quote)}”</p><div class="example-person">${avatar(index)}<span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(city)}</small></span></div></article>`
  ).join("");

  return `<section class="testimonials examples" aria-label="Depoimentos ilustrativos"><div class="shell example-heading"><div><span class="kicker">Depoimentos ilustrativos</span><h2>Veja como sua prova social pode aparecer.</h2><p>25 exemplos fictícios para visualizar o layout. Substitua por avaliações autorizadas de clientes antes de publicar.</p></div><button type="button" class="example-toggle" aria-pressed="false">Pausar animação</button></div><div class="example-window"><div class="example-track"><div class="example-group">${cards}</div><div class="example-group" aria-hidden="true">${cards}</div></div></div></section>`;
}