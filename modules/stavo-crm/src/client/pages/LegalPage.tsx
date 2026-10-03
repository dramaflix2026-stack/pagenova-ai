/**
 * Termos de Uso e Politica de Privacidade.
 *
 * Paginas publicas minimas, exigidas pelo uso da API do Google Maps Platform.
 * O desenvolvedor deve revisar as politicas oficiais vigentes antes do deploy.
 */
import { Link } from 'react-router-dom';

import { ATTRIBUTION_TEXT } from '@shared/constants';
import { Button, Card, CardContent } from '../components/ui';

interface LegalPageProps {
  document: 'terms' | 'privacy';
}

export default function LegalPage({ document }: LegalPageProps) {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/entrar">Voltar para o acesso</Link>
      </Button>

      <Card>
        <CardContent className="prose-sm space-y-4 text-sm leading-relaxed">
          {document === 'terms' ? <Terms /> : <Privacy />}
        </CardContent>
      </Card>
    </div>
  );
}

function Terms() {
  return (
    <>
      <h1 className="text-xl font-semibold">Termos de Uso</h1>

      <p className="text-muted-foreground">
        Esta e uma ferramenta interna e privada da Stavo Digital, usada por um unico administrador
        para organizar prospeccao, relacionamento comercial e controle financeiro proprio. Nao e um
        servico oferecido ao publico e nao aceita cadastro de terceiros.
      </p>

      <h2 className="text-base font-semibold">Uso permitido</h2>
      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
        <li>Pesquisar empresas por meio da API oficial do Google Places.</li>
        <li>Organizar leads, propostas, vendas e recebimentos proprios.</li>
        <li>Importar listas de contatos obtidas de forma legitima.</li>
      </ul>

      <h2 className="text-base font-semibold">Uso proibido</h2>
      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
        <li>Disparo em massa, spam ou prospecção automatizada sem consentimento.</li>
        <li>Extracao de dados do Google fora da API oficial.</li>
        <li>Armazenamento permanente de copia do conteudo retornado pelo Google.</li>
      </ul>

      <h2 className="text-base font-semibold">Dados de terceiros (Google)</h2>
      <p className="text-muted-foreground">
        Os dados de estabelecimentos exibidos vem do Google Maps Platform e sao consultados ao
        vivo, com atribuicao. A plataforma guarda apenas o identificador do local (place_id) e as
        informacoes que o administrador confirma explicitamente como dados proprios do CRM.
        O uso esta sujeito aos Termos de Servico do Google Maps Platform, que devem ser revisados
        na versao vigente antes de qualquer publicacao.
      </p>

      <h2 className="text-base font-semibold">Limitacoes</h2>
      <p className="text-muted-foreground">
        A plataforma organiza sinais e antecipa trabalho, mas nao garante que uma empresa nao
        possua site fora do Google, que um telefone tenha WhatsApp, que um perfil de Instagram
        encontrado seja oficial ou que os dados publicos estejam corretos. A validacao final e
        sempre humana. O modulo financeiro e controle comercial interno e nao substitui
        contabilidade fiscal oficial.
      </p>

      <p className="text-xs text-muted-foreground">{ATTRIBUTION_TEXT}</p>
    </>
  );
}

function Privacy() {
  return (
    <>
      <h1 className="text-xl font-semibold">Politica de Privacidade</h1>

      <p className="text-muted-foreground">
        Esta aplicacao e privada e possui um unico usuario: o administrador da Stavo Digital.
        Nao ha cadastro publico, compartilhamento com terceiros, publicidade ou rastreamento.
      </p>

      <h2 className="text-base font-semibold">Dados tratados</h2>
      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Do administrador:</strong> e-mail de acesso e hash da senha. A senha em si nunca
          e armazenada nem registrada em log.
        </li>
        <li>
          <strong>De leads:</strong> nome interno, contatos e links informados ou confirmados pelo
          administrador, anotacoes, historico comercial e registros financeiros.
        </li>
        <li>
          <strong>Do Google:</strong> apenas o identificador do local (place_id). O conteudo
          publico e consultado ao vivo e descartado apos a exibicao.
        </li>
      </ul>

      <h2 className="text-base font-semibold">Finalidade</h2>
      <p className="text-muted-foreground">
        Os dados sao usados exclusivamente para prospeccao comercial propria, acompanhamento de
        negociacoes e controle de recebimentos da Stavo Digital.
      </p>

      <h2 className="text-base font-semibold">Protecao</h2>
      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
        <li>Acesso protegido por senha, com sessao em cookie HttpOnly e expiracao automatica.</li>
        <li>Transmissao por HTTPS em producao.</li>
        <li>Segredos mantidos apenas em variaveis de ambiente do servidor.</li>
        <li>Registros de log sem senha, token, cookie ou credencial.</li>
      </ul>

      <h2 className="text-base font-semibold">Retencao e direitos</h2>
      <p className="text-muted-foreground">
        Leads sao arquivados em vez de excluidos, para preservar o historico comercial. O
        administrador pode exportar todos os dados proprios em JSON e CSV a qualquer momento pela
        tela de Configuracoes. Solicitacoes de titulares de dados podem ser atendidas manualmente
        pelo administrador, incluindo remocao definitiva mediante procedimento no servidor.
      </p>

      <p className="text-xs text-muted-foreground">{ATTRIBUTION_TEXT}</p>
    </>
  );
}
