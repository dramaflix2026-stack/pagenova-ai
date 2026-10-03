# Redefinição emergencial da senha do administrador

Esta versão **não possui** recuperação por e-mail, link mágico ou SMTP.
A redefinição é um procedimento administrativo executado **no servidor**.

---

## Quando usar

- A senha do administrador foi perdida.
- Há suspeita de acesso indevido e as sessões precisam ser encerradas.

Se você ainda consegue entrar, **não use este procedimento**: troque a senha em
Configurações → Segurança, que já exige a senha atual e revoga as demais sessões.

---

## Procedimento

Acesse o servidor por SSH e vá até a raiz da aplicação.

### 1. Confirme o que a operação faz

```bash
npm run admin:reset-password
```

Sem `--confirm`, o comando apenas explica a consequência e sai.

### 2. Execute com confirmação explícita

```bash
ADMIN_NEW_PASSWORD='<sua nova senha>' npm run admin:reset-password -- --confirm
```

Requisitos da nova senha: mínimo de **12 caracteres**, sem repetição óbvia e com
variedade razoável. O comando recusa senhas fracas e explica o motivo.

### 3. O que acontece

- A senha é regravada como hash `scrypt` com salt individual.
- **Todas** as sessões ativas são revogadas — qualquer navegador aberto precisa
  entrar novamente.
- Um registro entra em `audit_log` (`ADMIN_PASSWORD_RESET_CLI`).
- A senha **não** é exibida no terminal nem gravada em log.

### 4. Depois

```bash
unset ADMIN_NEW_PASSWORD
history -c   # se o shell registrar histórico
```

Faça login com a nova senha e confirme o acesso.

---

## Por que a senha vai por variável de ambiente

Passar a senha como **argumento** de linha de comando a deixaria visível na lista
de processos (`ps aux`) e no histórico do shell. Por isso o comando lê
`ADMIN_NEW_PASSWORD` do ambiente e recusa qualquer outra forma.

---

## Proibido

**Nunca** edite `users.password_hash` diretamente no phpMyAdmin ou por SQL.

- O formato é `scrypt$N$r$p$salt$hash`; um valor inválido bloqueia o login.
- As sessões ativas **não** seriam revogadas, mantendo o acesso de quem já estava
  dentro.
- Nenhum registro de auditoria seria criado.

Se o hash já foi corrompido manualmente, rode o procedimento acima: ele sobrescreve
o valor corretamente.

---

## Situações especiais

**"Nenhum usuario encontrado"**

O `ADMIN_EMAIL` do ambiente não corresponde ao usuário no banco. Verifique:

```sql
SELECT id, email, active FROM users;
```

E rode apontando o e-mail correto:

```bash
ADMIN_RESET_EMAIL='email@correto' ADMIN_NEW_PASSWORD='<senha>' \
  npm run admin:reset-password -- --confirm
```

**Nenhum usuário existe**

Defina `ADMIN_INITIAL_PASSWORD` no ambiente e rode `npm run admin:bootstrap`.
Remova a variável logo depois.

**Conta inativa**

A redefinição também reativa a conta (`active = true`).
