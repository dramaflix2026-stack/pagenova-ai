# Template Universal 1.0 — baseline congelada

Aprovado visualmente após o deploy Vercel READY do commit `96c505d6a9b4f43718240014163634fd52d5ab33`.

## Referência imutável
- Branch de referência: `release/template-universal-v1-frozen`
- Commit de referência: `96c505d6a9b4f43718240014163634fd52d5ab33`
- A branch congelada não deve receber novos commits.
- Alterações futuras devem acontecer em branches de desenvolvimento e ser comparadas com esta baseline antes do merge.

## Contrato visual e funcional
1. Um único Hero principal, sem duplicação de título, descrição ou CTA.
2. Galeria imediatamente antes de Perguntas Frequentes.
3. Desktop: linhas de galeria alternadas, imagem/texto e texto/imagem.
4. Mobile: manter a composição da galeria aprovada.
5. Manter seções, identidade visual, responsividade e funcionalidades já aprovadas.
6. A geração inicial utiliza a baseline estável; pedidos do cliente via chat podem editar livremente o site individual, sem alterar a baseline compartilhada.
7. Geração dentro e fora do CRM deve ser validada separadamente.
8. Não liberar mudanças no gerador sem compilação TypeScript, build e testes de regressão de Hero, galeria, FAQ e publicação.

## Reversão
Em caso de regressão, comparar os arquivos alterados com `release/template-universal-v1-frozen`. Não reverter edições/dados de clientes nem mudanças não relacionadas.

> Esta proteção é uma referência versionada no Git. Restrições de branch e testes automáticos bloqueantes ainda devem ser configurados separadamente.
