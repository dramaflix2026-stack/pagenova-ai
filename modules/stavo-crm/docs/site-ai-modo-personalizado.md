# Modo personalizado (Claude Agent SDK) — plano de infraestrutura

Documento de decisão, escrito para quem vai pagar e operar a infraestrutura.
Nada aqui está implementado: o que existe hoje é o **modo demonstração**, que
roda na Hostinger atual.

---

## 1. A diferença entre os dois modos

| | Modo demonstração (existe hoje) | Modo personalizado (este plano) |
| --- | --- | --- |
| Como o site nasce | Uma chamada à API devolve um SiteSpec; o servidor monta a página com componentes prontos | Um agente escreve o código do site, roda o build, olha o resultado e corrige |
| Onde roda | Aplicação Node na Hostinger | Container isolado, um por site |
| Tempo | Segundos | Minutos |
| Custo por site | Centavos | Estimados US$ 1 a 5, a confirmar por medição |
| Resultado | Consistente, dentro do catálogo de componentes | Layout sob medida, fora do catálogo |
| Risco | Baixo | Executa código gerado: exige isolamento real |

O modo demonstração continua sendo o padrão. O personalizado é para o cliente
que fechou e quer algo além do catálogo.

---

## 2. Por que a Hostinger atual não serve

A hospedagem compartilhada, no plano Business com aplicação Node.js:

- **não roda container.** Sem Docker não há isolamento de verdade entre o
  código gerado e o CRM, que roda no mesmo servidor;
- **não roda Chromium.** Sem navegador headless não há screenshot, e sem
  screenshot o agente não vê o que fez — que é justamente o que o torna melhor;
- **tem uma vaga de aplicação Node.** O agente e o CRM disputariam o mesmo
  processo e a mesma memória;
- **limita CPU e tempo de execução.** Um build de site leva minutos de CPU.

Rodar o agente no mesmo servidor do CRM também significaria que uma falha de
isolamento expõe o banco de leads. Isso não é aceitável.

---

## 3. Arquitetura proposta

```
CRM (Hostinger, como hoje)
  |  cria o job e envia o briefing + imagens (HTTPS, com segredo compartilhado)
  v
Servidor de geração (VPS próprio, isolado)
  |  para cada job: cria um container descartável
  v
Container (sem acesso à rede interna, sem credencial do CRM)
  - template Vite + Tailwind já pronto
  - imagens do cliente copiadas para dentro
  - Claude Agent SDK: escreve código -> build -> testes -> screenshot
  - uma rodada de correção visual
  - exporta HTML/CSS/JS estático
  |  devolve o ZIP estático + relatório de custo
  v
CRM publica pelo mesmo caminho de hoje (publisher/exporter)
```

O container **nunca** recebe credencial do banco, chave do Google nem acesso à
rede interna. Ele recebe texto e imagens, e devolve arquivos estáticos.

---

## 4. Opções de servidor

Preços são de referência e mudam: confirme antes de contratar.

| Opção | O que é | Prós | Contras | Ordem de custo/mês |
| --- | --- | --- | --- | --- |
| **VPS na Hostinger** (4 GB, 2 vCPU) | Servidor só seu, com Docker | Mesmo painel e mesmo fornecedor do CRM | Você administra: atualizações, firewall, backup | ~US$ 8–20 |
| VPS em outro provedor (Hetzner, DigitalOcean) | Igual | Boa relação preço/CPU | Fornecedor a mais para gerenciar | ~US$ 6–25 |
| Execução sob demanda (Fly.io, Cloud Run) | Container só quando há job | Não paga servidor parado | Configuração mais complexa; partida a frio | Por uso |

**Recomendação:** VPS de 4 GB com Docker, na própria Hostinger, para manter um
fornecedor só. Ela atende bem até algo como 20 a 40 sites por dia; acima disso,
vale reavaliar.

Some a isso o custo por site da API (estimado US$ 1 a 5) e o armazenamento das
imagens, que já existe.

---

## 5. Segurança (o que não pode faltar)

1. **Um container por site, descartado no fim.** Nada persiste entre jobs.
2. **Sem rede interna.** O container só alcança a API da Anthropic. Sem acesso
   ao MySQL, ao CRM ou a outros containers.
3. **Usuário sem privilégio, sistema de arquivos só de leitura**, exceto a
   pasta de trabalho.
4. **Tetos de CPU, memória e tempo.** Um job que passa do tempo é morto.
5. **Chave da Anthropic só no servidor de geração**, nunca dentro do container
   quando puder ser evitado, e nunca no CRM.
6. **O ZIP devolvido é validado** pelo CRM antes de publicar: mesmo sanitizador
   de HTML que já existe hoje, sem script externo.
7. **Autenticação entre CRM e servidor de geração** por segredo compartilhado,
   com origem restrita por IP.

---

## 6. Limites obrigatórios

Os mesmos princípios do modo demonstração, que já estão no código:

- **turnos**: teto de passos do agente por job;
- **tempo**: teto de minutos por job;
- **custo**: teto em dólares por job, verificado antes e durante;
- **uma rodada de correção visual**, não um laço aberto;
- **orçamento mensal** compartilhado com o modo demonstração, que já existe.

Sem esses tetos, um agente em laço consome crédito até o limite da conta.

---

## 7. Etapas de implantação

1. **Contratar e preparar o VPS**: Docker, firewall, usuário sem privilégio.
2. **Serviço de geração**: fila, criação de container, tetos, relatório de custo.
3. **Template base**: Vite + Tailwind + testes + script de screenshot.
4. **Integração com o Agent SDK**: ferramentas restritas ao diretório do job.
5. **Ligação com o CRM**: novo tipo de job, acompanhamento na tela, publicação
   pelo caminho atual.
6. **Teste com 3 nichos** e comparação lado a lado com o modo demonstração.

Estimativa de esforço: algo entre 2 e 4 semanas de trabalho, dependendo de
quanto o template base precisar de refinamento.

---

## 8. Quando isso se paga

Com custo fixo de servidor por volta de US$ 10–20 por mês mais US$ 1–5 por
site, o modo personalizado se paga se você cobrar por um site sob medida. Para
prospecção em massa — mandar uma demonstração para dezenas de leads — o modo
demonstração continua sendo o certo: é mais barato, mais rápido e mais
previsível.

**Sugestão:** só contrate o servidor quando existir o primeiro cliente disposto
a pagar por um site sob medida.
