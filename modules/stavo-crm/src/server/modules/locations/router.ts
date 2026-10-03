/**
 * Unidades federativas e municipios do Brasil.
 *
 *  GET /api/locations/states            as 27 unidades federativas
 *  GET /api/locations/states/:uf/cities os municipios daquela UF
 *
 * A lista e estatica e vive no proprio bundle do servidor (nao ha consulta ao
 * banco nem a servico externo). Ficar no servidor, e nao no bundle do
 * navegador, evita enviar 5.571 nomes de municipio para quem nunca abre a tela
 * de pesquisa.
 */
import { Router } from 'express';

import { CIDADES_POR_UF, ESTADOS } from '../../data/br-locations';
import { asyncHandler } from '../../lib/http';
import { notFound } from '../../lib/errors';
import { requireAuth } from '../../middleware';

export const locationsRouter: Router = Router();

locationsRouter.use(requireAuth);

/** Dado imutavel: o navegador pode guardar por um dia inteiro. */
const CACHE_DE_UM_DIA = 'private, max-age=86400';

locationsRouter.get('/locations/states', (_req, res) => {
  res.setHeader('Cache-Control', CACHE_DE_UM_DIA);
  res.json({ states: ESTADOS });
});

locationsRouter.get(
  '/locations/states/:uf/cities',
  asyncHandler(async (req, res) => {
    const uf = String(req.params.uf ?? '').toUpperCase();
    const cities = CIDADES_POR_UF[uf];

    if (!cities) {
      throw notFound('Unidade federativa nao encontrada.');
    }

    res.setHeader('Cache-Control', CACHE_DE_UM_DIA);
    res.json({ uf, cities });
  }),
);
