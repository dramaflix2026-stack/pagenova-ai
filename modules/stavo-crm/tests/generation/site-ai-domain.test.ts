/**
 * Dominio dos Sites com IA: maquinas de estado, slug e limites.
 *
 * Estas regras decidem se um link vai para o cliente, se um clique duplo custa
 * duas vezes e se um projeto trava. Sao puras de proposito para poderem ser
 * verificadas sem banco, sem HTTP e sem IA.
 */
import { describe, expect, it } from 'vitest';

import {
  cardActionFor,
  canTransitionJob,
  canTransitionProject,
  canTransitionPublication,
  DEFAULT_IMAGE_MODE,
  DEFAULT_MOTION_LEVEL,
  FORBIDDEN_SLUG_WORDS,
  hasRenderableSite,
  isProjectBusy,
  isTerminalJob,
  RESERVED_SLUGS,
  SITE_AI_HARD_LIMITS,
  SITE_JOB_STAGES,
  SITE_JOB_STATUSES,
  SITE_PROJECT_STATUSES,
  slugCandidates,
  slugify,
  stageProgress,
  validateSlug,
  type SiteProjectStatus,
} from '@site-kit/types/site-ai';

describe('maquina de estados do projeto', () => {
  it('nao permite gerar a partir de um projeto arquivado', () => {
    expect(canTransitionProject('ARCHIVED', 'QUEUED')).toBe(false);
    expect(canTransitionProject('ARCHIVED', 'READY')).toBe(false);
  });

  it('deixa republicar um projeto ja publicado sem passar por READY', () => {
    // "Atualizar publicacao" e o caminho normal: exigir uma volta a READY
    // faria o site sair do ar no meio da atualizacao.
    expect(canTransitionProject('PUBLISHED', 'PUBLISHED')).toBe(true);
  });

  it('deixa despublicar voltando ao estado editavel', () => {
    expect(canTransitionProject('PUBLISHED', 'READY')).toBe(true);
  });

  it('permite retomar uma geracao que falhou', () => {
    expect(canTransitionProject('FAILED', 'QUEUED')).toBe(true);
  });

  it('nao pula da fila direto para pronto', () => {
    // READY sem passar por GENERATING significaria projeto sem conteudo.
    expect(canTransitionProject('QUEUED', 'READY')).toBe(false);
  });

  it('todo status conhecido tem uma entrada na tabela de transicoes', () => {
    for (const status of SITE_PROJECT_STATUSES) {
      expect(() => canTransitionProject(status, 'ARCHIVED')).not.toThrow();
    }
  });

  it('marca como ocupado apenas o que esta na fila ou gerando', () => {
    const ocupados = SITE_PROJECT_STATUSES.filter(isProjectBusy);
    expect(ocupados).toEqual(['QUEUED', 'GENERATING']);
  });

  it('considera renderizavel apenas o que ja tem conteudo', () => {
    const renderizaveis = SITE_PROJECT_STATUSES.filter(hasRenderableSite);
    expect(renderizaveis).toEqual(['READY', 'PUBLISHED']);
  });
});

describe('acao oferecida no card do lead', () => {
  it('oferece criar quando nao ha projeto', () => {
    expect(cardActionFor(null)).toBe('CREATE');
    expect(cardActionFor(undefined)).toBe('CREATE');
  });

  it('oferece criar de novo quando o projeto foi arquivado', () => {
    expect(cardActionFor('ARCHIVED')).toBe('CREATE');
  });

  it('segue a tabela da especificacao', () => {
    const esperado: Record<SiteProjectStatus, string> = {
      BRIEFING: 'EDIT',
      QUEUED: 'PROGRESS',
      GENERATING: 'PROGRESS',
      READY: 'EDIT',
      PUBLISHED: 'OPEN',
      FAILED: 'RETRY',
      ARCHIVED: 'CREATE',
    };

    for (const status of SITE_PROJECT_STATUSES) {
      expect(cardActionFor(status), status).toBe(esperado[status]);
    }
  });
});

describe('maquina de estados do job', () => {
  it('devolve o job a fila quando o lease expira', () => {
    // E o que impede uma barra de progresso parada para sempre depois de um
    // restart do processo.
    expect(canTransitionJob('RUNNING', 'PENDING')).toBe(true);
  });

  it('nao ressuscita job concluido nem cancelado', () => {
    expect(canTransitionJob('SUCCEEDED', 'PENDING')).toBe(false);
    expect(canTransitionJob('CANCELED', 'PENDING')).toBe(false);
    expect(canTransitionJob('CANCELED', 'RUNNING')).toBe(false);
  });

  it('permite retomar um job que falhou', () => {
    expect(canTransitionJob('FAILED', 'PENDING')).toBe(true);
  });

  it('reconhece exatamente tres estados terminais', () => {
    const terminais = SITE_JOB_STATUSES.filter(isTerminalJob);
    expect(terminais).toEqual(['SUCCEEDED', 'FAILED', 'CANCELED']);
  });
});

describe('progresso das etapas', () => {
  it('cresce de forma estritamente crescente ate 100', () => {
    const valores = SITE_JOB_STAGES.map(stageProgress);

    for (let i = 1; i < valores.length; i += 1) {
      expect(valores[i]!, SITE_JOB_STAGES[i]).toBeGreaterThan(valores[i - 1]!);
    }
    expect(valores.at(-1)).toBe(100);
  });

  it('nunca comeca em zero: a primeira etapa ja e trabalho feito', () => {
    expect(stageProgress('VALIDATING_BRIEFING')).toBeGreaterThan(0);
  });
});

describe('maquina de estados da publicacao', () => {
  it('permite rollback de uma publicacao substituida', () => {
    expect(canTransitionPublication('SUPERSEDED', 'ACTIVE')).toBe(true);
  });

  it('nao reativa uma publicacao que falhou ao ser construida', () => {
    // Reativar um artefato que nunca ficou pronto colocaria um site quebrado
    // no ar sob o link ja enviado ao cliente.
    expect(canTransitionPublication('FAILED', 'ACTIVE')).toBe(false);
  });

  it('permite republicar depois de despublicar', () => {
    expect(canTransitionPublication('UNPUBLISHED', 'ACTIVE')).toBe(true);
  });
});

describe('slug publico', () => {
  it('remove acentuacao sem perder a letra', () => {
    expect(slugify('Clinica Sao Jose Acai')).toBe('clinica-sao-jose-acai');
    expect(slugify('Cafe & Cia')).toBe('cafe-cia');
    expect(slugify('Acao')).toBe('acao');
  });

  it('colapsa espacos e simbolos em um unico hifen', () => {
    expect(slugify('  Studio   Bella  ')).toBe('studio-bella');
    expect(slugify('A---B')).toBe('a-b');
  });

  it('recusa qualquer palavra que denuncie uma amostra', () => {
    for (const palavra of FORBIDDEN_SLUG_WORDS) {
      const resultado = validateSlug(`clinica-${palavra}`);
      expect(resultado.ok, palavra).toBe(false);
      if (!resultado.ok) expect(resultado.code).toBe('FORBIDDEN_WORD');
    }
  });

  it('nao confunde uma palavra proibida contida em outra legitima', () => {
    // "contest" contem "test"; olhar a string inteira recusaria um nome real.
    expect(validateSlug('contest-marketing').ok).toBe(true);
    expect(validateSlug('protesta-advocacia').ok).toBe(true);
  });

  it('recusa caminhos que a propria plataforma usa', () => {
    for (const reservado of RESERVED_SLUGS) {
      const resultado = validateSlug(reservado);
      expect(resultado.ok, reservado).toBe(false);
      if (!resultado.ok) expect(resultado.code).toBe('RESERVED');
    }
  });

  it('recusa vazio e texto sem nenhuma letra aproveitavel', () => {
    expect(validateSlug('')).toMatchObject({ ok: false, code: 'EMPTY' });
    expect(validateSlug('!!!')).toMatchObject({ ok: false, code: 'EMPTY' });
  });

  it('recusa slug curto demais e longo demais', () => {
    expect(validateSlug('ab')).toMatchObject({ ok: false, code: 'TOO_SHORT' });
    expect(validateSlug('a'.repeat(61))).toMatchObject({ ok: false, code: 'TOO_LONG' });
  });

  it('normaliza a entrada antes de aprovar', () => {
    const resultado = validateSlug('  Clinica Sao Jose  ');
    expect(resultado).toEqual({ ok: true, slug: 'clinica-sao-jose' });
  });
});

describe('candidatos de slug', () => {
  it('tenta o nome antes do nome com cidade', () => {
    expect(slugCandidates('Clinica Bella', 'Sao Paulo')).toEqual([
      'clinica-bella',
      'clinica-bella-sao-paulo',
    ]);
  });

  it('nao repete a cidade quando o nome ja termina nela', () => {
    expect(slugCandidates('Padaria Santos', 'Santos')).toEqual(['padaria-santos']);
  });

  it('descarta candidato que viola as regras do slug', () => {
    // O nome do negocio contem uma palavra proibida: nenhum candidato passa,
    // e o chamador cai no sufixo neutro em vez de publicar um link ruim.
    expect(slugCandidates('Teste')).toEqual([]);
  });

  it('devolve lista vazia quando nao sobra nada aproveitavel', () => {
    expect(slugCandidates('!!!')).toEqual([]);
  });
});

describe('tetos de seguranca', () => {
  it('limita tentativas de geracao e de reparo', () => {
    // Sem teto, uma resposta invalida em loop viraria uma conta impagavel.
    expect(SITE_AI_HARD_LIMITS.maxGenerationAttempts).toBeLessThanOrEqual(3);
    expect(SITE_AI_HARD_LIMITS.maxRepairAttempts).toBeLessThanOrEqual(1);
  });

  it('mantem os defaults economicos que a especificacao pede', () => {
    expect(DEFAULT_IMAGE_MODE).toBe('ECONOMY');
    expect(DEFAULT_MOTION_LEVEL).toBe('BALANCED');
  });
});
