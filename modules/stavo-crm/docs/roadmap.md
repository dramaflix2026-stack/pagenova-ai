# Marcos de implementação

Ordem de dependência (Seção 10 do prompt mestre). Cada marco só é fechado após
lint, typecheck e testes aplicáveis passarem.

| # | Marco | Entrega | Status |
| --- | --- | --- | --- |
| 1 | Inspeção, riscos e decisões | `docs/architecture.md`, `docs/risks.md`, este roadmap | concluído |
| 2 | Fundação técnica | package/tsconfig/eslint/prettier/vite/tailwind, Express base, validação de env, health/ready | concluído |
| 3 | Banco, migrações, seed | schema Drizzle, migração inicial, seed idempotente | concluído |
| 4 | Autenticação e segurança | login, sessão, CSRF, rate limit, troca de senha, bootstrap e reset admin | concluído |
| 5 | Design system e layout | componentes base, navegação desktop/mobile, estados | concluído |
| 6 | Configurações, origens, serviços e etapas | CRUD com proteção de histórico | concluído |
| 7 | CRM Kanban | colunas, cards, drawer, movimentação, filtros | concluído |
| 8 | Eventos, histórico e métricas | motor de eventos idempotente e consultas de métrica | concluído |
| 9 | Google Places | busca, detalhes ao vivo, quota, atribuição | concluído |
| 10 | Classificação e qualificação | links, telefone, Instagram, score explicável | concluído |
| 11 | Deduplicação global | identidades, revisão de duplicidade, concorrência | concluído |
| 12 | Importação e cadastro manual | wizard CSV/XLSX, relatório, revisão de vazios | concluído |
| 13 | Vendas, recebíveis e recorrências | vendas, pagamentos, assinaturas, estornos | concluído |
| 14 | Dashboard e metas | topo, atenção, funil, desempenho, metas | concluído |
| 15 | Exportação e backup | exportação JSON/CSV segura e documentação | concluído |
| 16 | Segurança e resiliência | revisão transversal documentada | concluído |
| 17 | Testes e jornadas | unit, integração, E2E | concluído |
| 18 | Deploy Hostinger | procedimento e verificação | documentado (requer credenciais do usuário) |
| 19 | Documentação e entrega | docs obrigatórios e evidências | concluído |
