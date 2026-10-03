/**
 * Pilha de desfazer/refazer generica, para o editor de sites.
 *
 * Deliberadamente simples: array de snapshots + ponteiro. Nao tenta
 * comprimir diffs nem mesclar edicoes -- para o tamanho de um SiteSchema (uma
 * pagina inteira), guardar o snapshot completo por passo e barato e muito
 * mais dificil de errar do que um diff estrutural.
 *
 * O historico e por SESSAO de edicao, em memoria. Persistencia de verdade e
 * o autosave (PATCH /config) e as versoes nomeadas (`site_project_versions`);
 * isto aqui e so o Ctrl+Z de quem esta digitando agora.
 */
import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 50;

export interface HistoryState<T> {
  value: T;
  canUndo: boolean;
  canRedo: boolean;
  /** Aplica um novo valor, empilhando o atual para desfazer. */
  set: (next: T) => void;
  /** Substitui o valor SEM empilhar -- usado ao carregar do servidor. */
  reset: (next: T) => void;
  undo: () => void;
  redo: () => void;
}

export function useHistoryState<T>(initial: T): HistoryState<T> {
  const [value, setValue] = useState(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  // Forca re-render quando past/future mudam sem que `value` mude (undo/redo
  // no topo da pilha ainda precisa atualizar canUndo/canRedo na tela).
  const [, forceTick] = useState(0);

  const set = useCallback(
    (next: T) => {
      past.current = [...past.current, value].slice(-MAX_HISTORY);
      future.current = [];
      setValue(next);
    },
    [value],
  );

  const reset = useCallback((next: T) => {
    past.current = [];
    future.current = [];
    setValue(next);
  }, []);

  const undo = useCallback(() => {
    setValue((current) => {
      const previous = past.current.at(-1);
      if (previous === undefined) return current;
      past.current = past.current.slice(0, -1);
      future.current = [current, ...future.current];
      return previous;
    });
    forceTick((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    setValue((current) => {
      const next = future.current[0];
      if (next === undefined) return current;
      future.current = future.current.slice(1);
      past.current = [...past.current, current];
      return next;
    });
    forceTick((n) => n + 1);
  }, []);

  return {
    value,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    set,
    reset,
    undo,
    redo,
  };
}
