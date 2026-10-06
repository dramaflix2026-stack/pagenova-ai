/**
 * Equipe.
 *  GET    /api/team            lista colaboradores
 *  POST   /api/team            adiciona colaborador
 *  PATCH  /api/team/:id        nome, cargo, ativo/inativo
 *  POST   /api/team/:id/password  redefine a senha
 *
 * Gerenciar equipe e do dono da conta. Listar e liberado para todos: o quadro
 * precisa dos nomes para mostrar quem trabalha cada lead, e a tela de
 * transferencia precisa saber para quem transferir.
 */
import { Router } from 'express';

import {
  createTeamMemberSchema,
  resetTeamMemberPasswordSchema,
  updateTeamMemberSchema,
} from '../../../shared/schemas';
import { getDb } from '../../db/client';
import { asyncHandler, parseBody } from '../../lib/http';
import { csrfProtection, requireAuth, requireCapability } from '../../middleware';
import { createTeamMember, listTeam, resetTeamMemberPassword, updateTeamMember } from './service';

export const teamRouter: Router = Router();

teamRouter.use(requireAuth);

teamRouter.get(
  '/team',
  asyncHandler(async (req, res) => {
    res.json({ members: await listTeam(getDb(), req.session!.workspaceId) });
  }),
);

teamRouter.post(
  '/team',
  csrfProtection,
  requireCapability('TEAM_MANAGE'),
  asyncHandler(async (req, res) => {
    const input = parseBody(createTeamMemberSchema, req);
    const member = await createTeamMember(getDb(), req.session!.workspaceId, input, req.session!.user.id);
    res.status(201).json({
      member,
      message: `${member.name} pode entrar com o e-mail e a senha que voce definiu.`,
    });
  }),
);

teamRouter.patch(
  '/team/:id',
  csrfProtection,
  requireCapability('TEAM_MANAGE'),
  asyncHandler(async (req, res) => {
    const input = parseBody(updateTeamMemberSchema, req);
    await updateTeamMember(getDb(), req.session!.workspaceId, req.params.id!, input, req.session!.user.id);
    res.json({ ok: true });
  }),
);

teamRouter.post(
  '/team/:id/password',
  csrfProtection,
  requireCapability('TEAM_MANAGE'),
  asyncHandler(async (req, res) => {
    const input = parseBody(resetTeamMemberPasswordSchema, req);
    await resetTeamMemberPassword(getDb(), req.session!.workspaceId, req.params.id!, input.password, req.session!.user.id);
    res.json({
      ok: true,
      message: 'Senha redefinida. A pessoa foi desconectada e precisa entrar de novo.',
    });
  }),
);
