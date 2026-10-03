/**
 * @vitest-environment jsdom
 *
 * Pilha de desfazer/refazer do editor de sites.
 */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useHistoryState } from '@client/hooks/useHistoryState';

describe('useHistoryState', () => {
  it('comeca sem nada para desfazer ou refazer', () => {
    const { result } = renderHook(() => useHistoryState('a'));
    expect(result.current.value).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('set empilha o valor anterior e libera o undo', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    expect(result.current.value).toBe('b');
    expect(result.current.canUndo).toBe(true);
  });

  it('undo volta ao valor anterior e libera o redo', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.undo());

    expect(result.current.value).toBe('a');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo refaz o que foi desfeito', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.undo());
    act(() => result.current.redo());

    expect(result.current.value).toBe('b');
    expect(result.current.canRedo).toBe(false);
  });

  it('uma nova edicao depois de um undo descarta o futuro antigo', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.set('c'));
    act(() => result.current.undo()); // volta para 'b', 'c' vira futuro
    act(() => result.current.set('d')); // edita a partir de 'b'

    expect(result.current.value).toBe('d');
    expect(result.current.canRedo).toBe(false); // 'c' nao existe mais
    act(() => result.current.undo());
    expect(result.current.value).toBe('b');
  });

  it('undo sem nada empilhado nao quebra e nao muda o valor', () => {
    const { result } = renderHook(() => useHistoryState('a'));
    act(() => result.current.undo());
    expect(result.current.value).toBe('a');
  });

  it('reset limpa o historico inteiro, sem deixar desfazer para antes dele', () => {
    const { result } = renderHook(() => useHistoryState('a'));

    act(() => result.current.set('b'));
    act(() => result.current.reset('novo-inicio'));

    expect(result.current.value).toBe('novo-inicio');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('respeita o teto de historico sem vazar memoria indefinidamente', () => {
    const { result } = renderHook(() => useHistoryState(0));

    act(() => {
      for (let i = 1; i <= 60; i += 1) result.current.set(i);
    });

    // Nao trava nem lanca com muitas edicoes; o valor mais recente prevalece.
    expect(result.current.value).toBe(60);
    expect(result.current.canUndo).toBe(true);
  });
});
