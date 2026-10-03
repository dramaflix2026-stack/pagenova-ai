/**
 * Combobox: lista suspensa com campo de busca no topo.
 *
 * Existe porque o Select do Radix nao tem busca, e listas como "municipios de
 * Sao Paulo" passam de 600 itens -- rolar ate encontrar seria inviavel.
 *
 * Decisoes:
 *  - a busca ignora acentos, entao "sao paulo" encontra "Sao Paulo";
 *  - so um numero limitado de itens e desenhado por vez; o restante aparece
 *    conforme a pessoa refina a busca, e o rodape avisa quantos ficaram de
 *    fora (uma lista cortada em silencio parece um item que sumiu);
 *  - teclado completo: setas, Enter, Escape, Home e End.
 */
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn, semAcento } from '../../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Texto discreto a direita, como a sigla da UF. */
  hint?: string;
}

export interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  /** Texto do gatilho quando nada foi escolhido. */
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Texto do gatilho quando desabilitado, explicando o que falta. */
  disabledPlaceholder?: string;
  loading?: boolean;
  /** Oferece a opcao de voltar ao estado "nada escolhido". */
  clearLabel?: string;
  /** Quantos itens sao desenhados por vez. */
  maxVisible?: number;
  className?: string;
}

/**
 * Filtra as opcoes pelo texto digitado, ignorando acentos e maiusculas.
 *
 * Cada palavra do termo precisa aparecer em algum lugar do rotulo ou da dica,
 * em qualquer ordem: "s jose campos" encontra "Sao Jose dos Campos", e "SP"
 * encontra "Sao Paulo" pela sigla.
 */
export function filtrarOpcoes(options: ComboboxOption[], busca: string): ComboboxOption[] {
  const termo = semAcento(busca);
  if (!termo) return options;

  const partes = termo.split(/\s+/);
  return options.filter((opcao) => {
    const alvo = semAcento(`${opcao.label} ${opcao.hint ?? ''}`);
    return partes.every((parte) => alvo.includes(parte));
  });
}

export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nada encontrado.',
  disabled = false,
  disabledPlaceholder,
  loading = false,
  clearLabel,
  maxVisible = 150,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState('');
  const [ativo, setAtivo] = useState(0);

  const listaId = useId();
  const listaRef = useRef<HTMLDivElement>(null);
  const buscaRef = useRef<HTMLInputElement>(null);

  const selecionado = options.find((opcao) => opcao.value === value) ?? null;

  const filtradas = useMemo(() => filtrarOpcoes(options, busca), [options, busca]);

  const visiveis = filtradas.slice(0, maxVisible);
  const ocultas = filtradas.length - visiveis.length;

  // Abrir sempre comeca limpo e posicionado sobre o item ja escolhido.
  useEffect(() => {
    if (!open) return;
    setBusca('');
    const posicao = options.findIndex((opcao) => opcao.value === value);
    setAtivo(posicao >= 0 ? posicao : 0);
  }, [open, options, value]);

  // Digitar muda a lista: o destaque volta para o primeiro resultado.
  useEffect(() => {
    setAtivo(0);
  }, [busca]);

  // Mantem o item destacado dentro da area visivel ao navegar pelo teclado.
  useEffect(() => {
    if (!open) return;
    listaRef.current?.querySelector('[data-ativo="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [ativo, open]);

  const escolher = (opcao: ComboboxOption) => {
    onChange(opcao.value);
    setOpen(false);
  };

  const aoTeclar = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (visiveis.length === 0) return;
      const passo = evento.key === 'ArrowDown' ? 1 : -1;
      setAtivo((atual) => (atual + passo + visiveis.length) % visiveis.length);
      return;
    }
    if (evento.key === 'Home') {
      evento.preventDefault();
      setAtivo(0);
      return;
    }
    if (evento.key === 'End') {
      evento.preventDefault();
      setAtivo(Math.max(visiveis.length - 1, 0));
      return;
    }
    if (evento.key === 'Enter') {
      evento.preventDefault();
      const opcao = visiveis[ativo];
      if (opcao) escolher(opcao);
    }
  };

  const rotuloGatilho = disabled
    ? (disabledPlaceholder ?? placeholder)
    : (selecionado?.label ?? placeholder);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled || loading}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input',
            'bg-surface px-3 text-left text-sm text-foreground',
            'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
            className,
          )}
        >
          <span className={cn('truncate', !selecionado && 'text-muted-foreground')}>
            {rotuloGatilho}
          </span>
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] min-w-[12rem] overflow-hidden',
            'rounded-md border border-border bg-surface shadow-lg',
          )}
          // O foco vai para o campo de busca, nao para o primeiro item da lista.
          onOpenAutoFocus={(evento) => {
            evento.preventDefault();
            buscaRef.current?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
            <input
              ref={buscaRef}
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              onKeyDown={aoTeclar}
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              role="combobox"
              aria-expanded="true"
              aria-controls={listaId}
              aria-autocomplete="list"
              aria-activedescendant={visiveis[ativo] ? `${listaId}-${ativo}` : undefined}
            />
          </div>

          <div ref={listaRef} className="max-h-72 overflow-y-auto p-1">
            {clearLabel && value ? (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden="true" />
                {clearLabel}
              </button>
            ) : null}

            {visiveis.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <div role="listbox" id={listaId} aria-label={placeholder}>
                {visiveis.map((opcao, indice) => {
                  const escolhida = opcao.value === value;
                  return (
                    <div
                      key={opcao.value}
                      id={`${listaId}-${indice}`}
                      role="option"
                      aria-selected={escolhida}
                      data-ativo={indice === ativo}
                      onMouseEnter={() => setAtivo(indice)}
                      onClick={() => escolher(opcao)}
                      className={cn(
                        'flex cursor-pointer select-none items-center gap-2 rounded-sm py-2 pl-8 pr-3 text-sm',
                        'relative data-[ativo=true]:bg-muted',
                      )}
                    >
                      {escolhida ? (
                        <Check className="absolute left-2 h-4 w-4" aria-hidden="true" />
                      ) : null}
                      <span className="truncate">{opcao.label}</span>
                      {opcao.hint ? (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {opcao.hint}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}

            {ocultas > 0 ? (
              <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                Mostrando {visiveis.length} de {filtradas.length}. Digite para refinar.
              </p>
            ) : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
