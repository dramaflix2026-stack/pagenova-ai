/**
 * Tela de login.
 *
 * Sem cadastro publico, sem "esqueci minha senha" e sem login social.
 * O erro e sempre generico para nao permitir descobrir se um e-mail existe.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginInput } from '@shared/schemas';
import { ApiError } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, CardContent, Field, Input } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Nao foi possivel entrar agora. Verifique sua conexao e tente novamente.',
      );
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Stavo Digital</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito ao administrador da plataforma.
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <Field label="E-mail" htmlFor="email" error={errors.email?.message} required>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  inputMode="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </Field>

              <Field label="Senha" htmlFor="password" error={errors.password?.message} required>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="pr-11"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </Field>

              {formError ? (
                <p
                  className="rounded-md border border-destructive/25 bg-destructive-soft px-3 py-2 text-sm text-foreground"
                  role="alert"
                  aria-live="assertive"
                >
                  {formError}
                </p>
              ) : null}

              <Button type="submit" block loading={isSubmitting} loadingText="Entrando...">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Esta e uma ferramenta privada. Nao existe cadastro nem recuperacao de senha por e-mail.
        </p>
      </div>
    </div>
  );
}
