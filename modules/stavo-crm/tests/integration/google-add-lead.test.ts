/**
 * Adicionar ao CRM salva telefone/site/Maps automaticamente (secao 30).
 *
 * Decisao explicita do usuario (2026-08-29): telefone, site/Instagram e o
 * link do Google Maps que ja aparecem no card de pesquisa entram no lead
 * SEM exigir confirmacao extra -- e a mesma consulta que ja rodou, nunca uma
 * chamada nova ao Google. `origin='MANUAL'` (o mesmo peso de qualquer dado
 * digitado na hora de criar o lead) -- "confirmado" (`isConfirmed=true`)
 * continua sendo so o botao do drawer, que revisa campo a campo.
 *
 * Sem TEST_DB_* configurado a suite e IGNORADA com aviso -- nunca mascarada
 * como aprovada. Veja docs/testing.md.
 */
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { leadContacts, leadLinks } from '@server/db/schema';
import { mapsLinkFromPlaceId } from '@server/domain/links';
import { createLead } from '@server/modules/leads/service';

import { hasTestDatabase, resetDatabase, schema, setupTestDatabase, SKIP_MESSAGE, teardownTestDatabase } from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

const ADMIN = 'usuario-de-teste-000000001';

/**
 * Reproduz exatamente o que `POST /api/google/leads` monta a partir do
 * corpo validado -- ver `src/server/modules/google/router.ts`.
 */
async function addFromSearch(
  db: Database,
  overrides: {
    placeId: string;
    internalName: string;
    confirmedPhoneE164?: string | null;
    confirmedWebsiteUrl?: string | null;
  },
) {
  const contacts: { type: 'PHONE'; value: string; isPrimary: boolean }[] = [];
  if (overrides.confirmedPhoneE164) {
    contacts.push({ type: 'PHONE', value: overrides.confirmedPhoneE164, isPrimary: true });
  }
  const links: { type: 'WEBSITE' | 'MAPS'; url: string; isPrimary: boolean }[] = [];
  if (overrides.confirmedWebsiteUrl) {
    links.push({ type: 'WEBSITE', url: overrides.confirmedWebsiteUrl, isPrimary: false });
  }
  links.push({ type: 'MAPS', url: mapsLinkFromPlaceId(overrides.placeId), isPrimary: false });

  return createLead(db, '01TESTWORKSPACE000000000001', {
      internalName: overrides.internalName,
      originType: 'GOOGLE_PLACE',
      sourceId: null,
      placeId: overrides.placeId,
      niche: null,
      country: null,
      state: null,
      city: null,
      address: null,
      campaignContext: null,
      notes: null,
      contacts,
      links,
      serviceId: null,
      proposedPrice: null,
      nextFollowUpAt: null,
      allowSharedIdentity: false,
      sharedIdentityReason: null,
    },
    {
      actorUserId: ADMIN,
      originType: 'GOOGLE_PLACE',
      searchRunId: null,
      dataOrigin: 'MANUAL',
    },
  );
}

suite('adicionar ao CRM salva telefone/site/Maps automaticamente', () => {
  let db: Database;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    const now = new Date();
    await db.insert(schema.users).values({
      id: ADMIN,
      email: 'teste-google-add@stavo.local',
      passwordHash: 'scrypt$32768$8$1$AAAA$AAAA',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  it('sem telefone nem site no card, o lead ainda ganha o link do Maps (derivado do place_id)', async () => {
    const { lead } = await addFromSearch(db, {
      placeId: 'ChIJ_so_place_id',
      internalName: 'Padaria So Place Id',
    });

    expect(lead.placeId).toBe('ChIJ_so_place_id');

    const contacts = await db.select().from(leadContacts).where(eq(leadContacts.leadId, lead.id));
    const [link] = await db.select().from(leadLinks).where(eq(leadLinks.leadId, lead.id));
    expect(contacts).toHaveLength(0);
    expect(link?.type).toBe('MAPS');
    // `insertLinks` normaliza a URL (ex.: tira o "www."); o que importa aqui
    // e o place_id certo chegar ao link salvo, nao a string byte a byte.
    expect(link?.url).toContain('place_id:ChIJ_so_place_id');
  });

  it('telefone do card vira contato MANUAL (nao confirmado) automaticamente, sem clique extra', async () => {
    const { lead } = await addFromSearch(db, {
      placeId: 'ChIJ_com_telefone',
      internalName: 'Clinica Com Telefone',
      confirmedPhoneE164: '+5511988887777',
    });

    const [contact] = await db.select().from(leadContacts).where(eq(leadContacts.leadId, lead.id));
    expect(contact?.type).toBe('PHONE');
    expect(contact?.origin).toBe('MANUAL');
    // Nao e "confirmado por voce" -- so o botao do drawer promove a isso.
    expect(contact?.isConfirmed).toBe(false);
    expect(contact?.normalizedValue).toBe('+5511988887777');
  });

  it('site do card vira link classificado como site proprio, automaticamente', async () => {
    const { lead } = await addFromSearch(db, {
      placeId: 'ChIJ_com_site',
      internalName: 'Estudio Com Site',
      confirmedWebsiteUrl: 'https://estudiocomsite.com.br',
    });

    const links = await db.select().from(leadLinks).where(eq(leadLinks.leadId, lead.id));
    const website = links.find((l) => l.type === 'WEBSITE');
    const maps = links.find((l) => l.type === 'MAPS');
    expect(website?.origin).toBe('MANUAL');
    expect(maps).toBeTruthy();
  });

  it('um Instagram enviado como "site" e classificado como INSTAGRAM, nunca como site proprio', async () => {
    // A propria API do Google as vezes devolve o Instagram no campo de site;
    // a classificacao final e por conteudo da URL, nunca pelo rotulo enviado.
    const { lead } = await addFromSearch(db, {
      placeId: 'ChIJ_instagram_como_site',
      internalName: 'Cafe Instagram Como Site',
      confirmedWebsiteUrl: 'https://www.instagram.com/cafeinstagramcomosite',
    });

    const links = await db.select().from(leadLinks).where(eq(leadLinks.leadId, lead.id));
    expect(links.find((l) => l.type === 'INSTAGRAM')).toBeTruthy();
  });

  it('o link do Google Maps nunca e classificado como diretorio, mesmo o host sendo google.com', async () => {
    // Achado real: google.com esta na lista de diretorios/plataformas
    // (normalmente e isso que ele e). Sem tratamento especial, a propria URL
    // do Maps que nos mesmos construimos virava tipo DIRECTORY.
    const { lead } = await addFromSearch(db, {
      placeId: 'ChIJ_maps_nao_e_diretorio',
      internalName: 'Salao Maps Nao E Diretorio',
    });

    const [link] = await db.select().from(leadLinks).where(eq(leadLinks.leadId, lead.id));
    expect(link?.type).toBe('MAPS');
    expect(link?.type).not.toBe('DIRECTORY');
  });

  it('telefone invalido nao trava a criacao: entra marcado para revisao, nunca some', async () => {
    const { lead } = await addFromSearch(db, {
      placeId: 'ChIJ_telefone_estranho',
      internalName: 'Oficina Telefone Estranho',
      confirmedPhoneE164: '123',
    });

    const [contact] = await db.select().from(leadContacts).where(eq(leadContacts.leadId, lead.id));
    expect(contact).toBeTruthy();
    expect(contact?.isValid).toBe(false);
  });

  it('o mesmo place_id continua bloqueado mesmo com dados novos na segunda tentativa', async () => {
    await addFromSearch(db, { placeId: 'ChIJ_duplicado', internalName: 'Loja Duplicada' });

    await expect(
      addFromSearch(db, {
        placeId: 'ChIJ_duplicado',
        internalName: 'Loja Duplicada De Novo',
        confirmedPhoneE164: '+5511977776666',
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_LEAD' });

    // Nenhum contato vazou para o lead original a partir da tentativa recusada.
    const [existing] = await db
      .select()
      .from(leadContacts)
      .where(and(eq(leadContacts.value, '+5511977776666')));
    expect(existing).toBeUndefined();
  });
});
