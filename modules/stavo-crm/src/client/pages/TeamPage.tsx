/**
 * Equipe.
 *
 * Todos veem quem trabalha na empresa -- isso e o que permite o quadro dizer
 * "Lucas esta trabalhando este lead". Adicionar, mudar cargo e desativar sao
 * acoes do dono da conta.
 *
 * Colaborador nunca e apagado: e desativado. Apagar levaria junto o historico
 * de quem prospectou e vendeu o que.
 */
import { KeyRound, Pencil, Plus, Power, PowerOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { USER_ROLES, USER_ROLE_DESCRIPTIONS, USER_ROLE_LABELS, type UserRole } from '@shared/roles';
import { formatDateTime } from '@shared/format';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import {
  sugerirSenha,
  useCreateTeamMember,
  useResetTeamMemberPassword,
  useTeam,
  useUpdateTeamMember,
  type TeamMember,
} from '../hooks/useTeam';
import { ApiError } from '../lib/api';

/** Mesmo minimo exigido pelo servidor (src/server/modules/auth/password.ts). */
const MIN_SENHA = 12;

const CARGO_TOM: Record<UserRole, 'primary' | 'success' | 'neutral' | 'outline'> = {
  OWNER: 'primary',
  PARTNER: 'success',
  EMPLOYEE: 'neutral',
  SUPPORT: 'outline',
};

const mensagemDeErro = (erro: unknown, padrao: string) =>
  erro instanceof ApiError ? erro.message : padrao;

export default function TeamPage() {
  const toast = useToast();
  const { user, pode } = useAuth();
  const team = useTeam();
  const criar = useCreateTeamMember();
  const atualizar = useUpdateTeamMember();
  const redefinir = useResetTeamMemberPassword();

  const gerencia = pode('TEAM_MANAGE');

  const [novoAberto, setNovoAberto] = useState(false);
  const [errosDoNovo, setErrosDoNovo] = useState<Record<string, string[]> | undefined>();
  const [editando, setEditando] = useState<TeamMember | null>(null);
  const [senhaDe, setSenhaDe] = useState<TeamMember | null>(null);
  const [desativando, setDesativando] = useState<TeamMember | null>(null);

  const membros = team.data?.members ?? [];

  const alternarAtivo = async (membro: TeamMember, ativo: boolean) => {
    try {
      await atualizar.mutateAsync({ id: membro.id, active: ativo });
      toast.success(
        ativo ? `${membro.name} reativado` : `${membro.name} desativado`,
        ativo
          ? 'Ele pode entrar novamente.'
          : 'As sessoes foram encerradas e os leads dele ficaram sem dono.',
      );
      setDesativando(null);
    } catch (erro) {
      toast.error(
        'Nao foi possivel alterar',
        mensagemDeErro(erro, 'Tente novamente em instantes.'),
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Quem trabalha na empresa e o que cada cargo pode fazer."
        actions={
          gerencia ? (
            <Button onClick={() => setNovoAberto(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adicionar pessoa
            </Button>
          ) : null
        }
      />

      <PageBody className="space-y-4">
        {!gerencia ? (
          <Callout tone="info" title="Somente leitura">
            Adicionar e alterar colaboradores e do dono da conta. Voce ve a equipe para saber quem
            trabalha cada lead.
          </Callout>
        ) : null}

        {team.isLoading ? (
          <LoadingBlock label="Carregando a equipe..." />
        ) : team.isError ? (
          <ErrorState
            title="Nao foi possivel carregar a equipe"
            message="Tente novamente em instantes."
            onRetry={() => void team.refetch()}
          />
        ) : membros.length === 0 ? (
          <EmptyState
            title="Nenhum colaborador ainda"
            description="Adicione socios, vendedores ou suporte para trabalharem junto no mesmo CRM."
          />
        ) : (
          <div className="grid gap-3">
            {membros.map((membro) => (
              <Card key={membro.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{membro.name}</p>
                      <Badge tone={CARGO_TOM[membro.role]}>{USER_ROLE_LABELS[membro.role]}</Badge>
                      {membro.id === user?.id ? <Badge tone="outline">Voce</Badge> : null}
                      {!membro.active ? <Badge tone="danger">Desativado</Badge> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{membro.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {membro.leadCount === 0
                        ? 'Nenhum lead sob responsabilidade'
                        : membro.leadCount === 1
                          ? '1 lead sob responsabilidade'
                          : `${membro.leadCount} leads sob responsabilidade`}
                      {membro.lastLoginAt
                        ? ` · ultimo acesso em ${formatDateTime(membro.lastLoginAt)}`
                        : ' · nunca entrou'}
                    </p>
                    <p className="mt-2 max-w-prose text-xs text-muted-foreground">
                      {USER_ROLE_DESCRIPTIONS[membro.role]}
                    </p>
                  </div>

                  {gerencia ? (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setEditando(membro)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setSenhaDe(membro)}>
                        <KeyRound className="h-4 w-4" aria-hidden="true" />
                        Senha
                      </Button>
                      {membro.id === user?.id ? null : membro.active ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDesativando(membro)}
                        >
                          <PowerOff className="h-4 w-4" aria-hidden="true" />
                          Desativar
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void alternarAtivo(membro, true)}
                        >
                          <Power className="h-4 w-4" aria-hidden="true" />
                          Reativar
                        </Button>
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />O que cada cargo pode
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {USER_ROLES.map((cargo) => (
                <div key={cargo} className="rounded-md border border-border p-3">
                  <dt className="text-sm font-medium">{USER_ROLE_LABELS[cargo]}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">
                    {USER_ROLE_DESCRIPTIONS[cargo]}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Em todos os cargos, o lead so pode ser movido, editado ou vendido por quem e dono
              dele. Os demais acompanham sem alterar.
            </p>
          </CardContent>
        </Card>
      </PageBody>

      <MemberDialog
        open={novoAberto}
        onOpenChange={(aberto) => {
          if (!aberto) setErrosDoNovo(undefined);
          setNovoAberto(aberto);
        }}
        loading={criar.isPending}
        fieldErrors={errosDoNovo}
        onSubmit={async (dados) => {
          setErrosDoNovo(undefined);
          try {
            const resposta = await criar.mutateAsync(dados);
            toast.success(`${dados.name} adicionado`, resposta.message);
            setNovoAberto(false);
          } catch (erro) {
            // O servidor diz QUAL campo recusou. Guardar isso e o que
            // transforma "alguns campos precisam ser corrigidos" em uma
            // mensagem embaixo do campo errado.
            if (erro instanceof ApiError && erro.fieldErrors) {
              setErrosDoNovo(erro.fieldErrors);
            }
            toast.error(
              'Nao foi possivel adicionar',
              mensagemDeErro(erro, 'Confira os dados e tente novamente.'),
            );
          }
        }}
      />

      <EditMemberDialog
        member={editando}
        onOpenChange={(aberto) => {
          if (!aberto) setEditando(null);
        }}
        loading={atualizar.isPending}
        onSubmit={async (dados) => {
          if (!editando) return;
          try {
            await atualizar.mutateAsync({ id: editando.id, ...dados });
            toast.success('Colaborador atualizado');
            setEditando(null);
          } catch (erro) {
            toast.error(
              'Nao foi possivel salvar',
              mensagemDeErro(erro, 'Tente novamente em instantes.'),
            );
          }
        }}
      />

      <PasswordDialog
        member={senhaDe}
        onOpenChange={(aberto) => {
          if (!aberto) setSenhaDe(null);
        }}
        loading={redefinir.isPending}
        onSubmit={async (password) => {
          if (!senhaDe) return;
          try {
            const resposta = await redefinir.mutateAsync({ id: senhaDe.id, password });
            toast.success('Senha redefinida', resposta.message);
            setSenhaDe(null);
          } catch (erro) {
            toast.error(
              'Nao foi possivel redefinir',
              mensagemDeErro(erro, 'Escolha uma senha mais forte.'),
            );
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(desativando)}
        onOpenChange={(aberto) => {
          if (!aberto) setDesativando(null);
        }}
        title="Desativar colaborador"
        description={`${desativando?.name ?? ''} perde o acesso imediatamente.`}
        consequence="Nada e apagado: o historico de quem prospectou e vendeu continua. Os leads dele ficam sem dono para voce redistribuir, e as sessoes abertas sao encerradas."
        confirmLabel="Desativar"
        loading={atualizar.isPending}
        onConfirm={() => {
          if (desativando) void alternarAtivo(desativando, false);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------

interface NovoMembro {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

function MemberDialog({
  open,
  onOpenChange,
  loading,
  fieldErrors,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  /** Erros por campo devolvidos pelo servidor, quando a validacao recusa. */
  fieldErrors: Record<string, string[]> | undefined;
  onSubmit: (dados: NovoMembro) => void;
}) {
  const [form, setForm] = useState<NovoMembro>({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    password: sugerirSenha(),
  });

  const erroDe = (campo: string) => fieldErrors?.[campo]?.[0];

  // Checagem local com a MESMA regra do servidor. Sem isto o botao fica
  // clicavel e a pessoa so descobre o problema depois de um erro generico.
  const senhaCurta = form.password.length < MIN_SENHA;
  const nomeCurto = form.name.trim().length < 2;
  const emailInvalido = !/^[^s@]+@[^s@]+.[^s@]+$/.test(form.email.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(proximo) => {
        // Cada abertura comeca limpa, com uma senha nova sugerida.
        if (proximo) setForm({ name: '', email: '', role: 'EMPLOYEE', password: sugerirSenha() });
        onOpenChange(proximo);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar pessoa</DialogTitle>
          <DialogDescription>
            Ela entra com o e-mail e a senha definidos aqui, e pode troca-la depois.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <Field label="Nome" htmlFor="membro-nome" required error={erroDe('name')}>
            <Input
              id="membro-nome"
              value={form.name}
              onChange={(evento) => setForm((atual) => ({ ...atual, name: evento.target.value }))}
              placeholder="Ex.: Lucas Andrade"
            />
          </Field>

          <Field label="E-mail" htmlFor="membro-email" required error={erroDe('email')}>
            <Input
              id="membro-email"
              type="email"
              value={form.email}
              onChange={(evento) => setForm((atual) => ({ ...atual, email: evento.target.value }))}
              placeholder="lucas@empresa.com.br"
            />
          </Field>

          <Field
            label="Cargo"
            htmlFor="membro-cargo"
            hint={USER_ROLE_DESCRIPTIONS[form.role]}
            required
          >
            <Select
              value={form.role}
              onValueChange={(valor) => setForm((atual) => ({ ...atual, role: valor as UserRole }))}
            >
              <SelectTrigger id="membro-cargo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((cargo) => (
                  <SelectItem key={cargo} value={cargo}>
                    {USER_ROLE_LABELS[cargo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Senha inicial"
            htmlFor="membro-senha"
            hint={`Minimo de ${MIN_SENHA} caracteres. Copie e entregue a pessoa por um canal seguro.`}
            required
            error={
              erroDe('password') ??
              (senhaCurta && form.password.length > 0
                ? `Faltam ${MIN_SENHA - form.password.length} caractere(s) para o minimo de ${MIN_SENHA}.`
                : undefined)
            }
          >
            <Input
              id="membro-senha"
              value={form.password}
              onChange={(evento) =>
                setForm((atual) => ({ ...atual, password: evento.target.value }))
              }
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            loading={loading}
            disabled={nomeCurto || emailInvalido || senhaCurta}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDialog({
  member,
  onOpenChange,
  loading,
  onSubmit,
}: {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (dados: { name: string; role: UserRole }) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [carregado, setCarregado] = useState<string | null>(null);

  // Preenche uma vez por colaborador aberto, sem sobrescrever o que foi
  // digitado a cada renderizacao.
  if (member && carregado !== member.id) {
    setName(member.name);
    setRole(member.role);
    setCarregado(member.id);
  }

  return (
    <Dialog
      open={Boolean(member)}
      onOpenChange={(proximo) => {
        if (!proximo) setCarregado(null);
        onOpenChange(proximo);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar colaborador</DialogTitle>
          <DialogDescription>{member?.email}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-3">
          <Field label="Nome" htmlFor="editar-nome" required>
            <Input id="editar-nome" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field label="Cargo" htmlFor="editar-cargo" hint={USER_ROLE_DESCRIPTIONS[role]} required>
            <Select value={role} onValueChange={(valor) => setRole(valor as UserRole)}>
              <SelectTrigger id="editar-cargo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((cargo) => (
                  <SelectItem key={cargo} value={cargo}>
                    {USER_ROLE_LABELS[cargo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {member && role !== member.role ? (
            <Callout tone="warning" title="Trocar o cargo encerra as sessoes">
              A pessoa sera desconectada e precisa entrar de novo. Isso garante que o cargo antigo
              nao continue valendo em uma aba aberta.
            </Callout>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit({ name: name.trim(), role })}
            loading={loading}
            disabled={name.trim().length < 2}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  member,
  onOpenChange,
  loading,
  onSubmit,
}: {
  member: TeamMember | null;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onSubmit: (password: string) => void;
}) {
  const [password, setPassword] = useState('');

  return (
    <Dialog
      open={Boolean(member)}
      onOpenChange={(proximo) => {
        if (proximo) setPassword(sugerirSenha());
        onOpenChange(proximo);
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            {member?.name} sera desconectado e precisa entrar com a nova senha.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Field
            label="Nova senha"
            htmlFor="nova-senha"
            hint={`Minimo de ${MIN_SENHA} caracteres. Entregue por um canal seguro.`}
            required
            error={
              password.length > 0 && password.length < MIN_SENHA
                ? `Faltam ${MIN_SENHA - password.length} caractere(s) para o minimo de ${MIN_SENHA}.`
                : undefined
            }
          >
            <Input
              id="nova-senha"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSubmit(password)}
            loading={loading}
            disabled={password.length < MIN_SENHA}
          >
            Redefinir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
