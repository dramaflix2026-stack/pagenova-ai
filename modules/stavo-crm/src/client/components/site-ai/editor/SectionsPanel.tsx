/**
 * Painel de secoes (secao 15.3 da especificacao).
 *
 * Reordenar usa botoes de subir/descer, nao arrastar-e-soltar. E uma reducao
 * de escopo deliberada: alcanca o mesmo resultado (qualquer ordem, sem
 * limite) com muito menos superficie de erro do que uma integracao de
 * drag-and-drop com teclado acessivel, dentro do tempo disponivel para esta
 * etapa. Documentado como decisao, nao como esquecimento.
 */
import { ChevronDown, ChevronUp, Copy, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import type { SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';
import { Button } from '../../ui';

interface SectionsPanelProps {
  sections: SiteSchemaModel['sections'];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onToggleVisible: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const sectionLabel = (section: SiteSection): string => {
  if ('headline' in section && section.headline) return section.headline;
  return section.type;
};

export function SectionsPanel({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onToggleVisible,
  onDuplicate,
  onDelete,
}: SectionsPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-border">
      <div className="border-b border-border p-3">
        <p className="text-sm font-semibold">Secoes</p>
        <p className="text-xs text-muted-foreground">{sections.length} nesta pagina</p>
      </div>

      <ul className="flex-1 divide-y divide-border">
        {sections.map((section, index) => (
          <li
            key={section.id}
            className={
              'group flex items-center gap-1 px-2 py-2 text-sm ' +
              (section.id === selectedId ? 'bg-primary-soft' : 'hover:bg-muted')
            }
          >
            <button
              type="button"
              onClick={() => onSelect(section.id)}
              className="flex-1 truncate text-left"
              title={sectionLabel(section)}
            >
              <span className="block truncate font-medium">{sectionLabel(section)}</span>
              <span className="text-xs capitalize text-muted-foreground">{section.type}</span>
            </button>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
              <IconButton
                label="Mover para cima"
                disabled={index === 0}
                onClick={() => onReorder(index, index - 1)}
                icon={<ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <IconButton
                label="Mover para baixo"
                disabled={index === sections.length - 1}
                onClick={() => onReorder(index, index + 1)}
                icon={<ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <IconButton
                label={section.visible ? 'Ocultar secao' : 'Mostrar secao'}
                onClick={() => onToggleVisible(section.id)}
                icon={
                  section.visible ? (
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  )
                }
              />
              <IconButton
                label="Duplicar secao"
                onClick={() => onDuplicate(section.id)}
                icon={<Copy className="h-3.5 w-3.5" aria-hidden="true" />}
              />
              <IconButton
                label="Excluir secao"
                onClick={() => onDelete(section.id)}
                icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                danger
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-border p-2">
        <Button variant="secondary" size="sm" className="w-full" disabled title="Catalogo completo chega na proxima etapa">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Adicionar secao
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        'rounded p-1 text-muted-foreground transition disabled:cursor-not-allowed disabled:opacity-30 ' +
        (danger ? 'hover:bg-destructive-soft hover:text-destructive' : 'hover:bg-surface hover:text-foreground')
      }
    >
      {icon}
    </button>
  );
}
