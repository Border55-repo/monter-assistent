import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Box,
  Layers3,
  LayoutGrid,
  PanelTop,
  Ruler,
  Wrench,
  TreePine,
  X,
} from "lucide-react";
import type { Kind } from "../lib/types";
export const calcIcons = {
  insulation: Layers3,
  timber: TreePine,
  deck: LayoutGrid,
  sheets: PanelTop,
  cladding: Ruler,
  flooring: Box,
  fixings: Wrench,
};
export function CalcIcon({ kind, size = 24 }: { kind: Kind; size?: number }) {
  const Icon = calcIcons[kind];
  return <Icon size={size} strokeWidth={1.6} />;
}
export function Field({
  label,
  value,
  onChange,
  unit,
  hint,
  disabled = false,
  text = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  hint?: string;
  disabled?: boolean;
  text?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          aria-label={label}
          aria-describedby={unit || hint ? `${id}-help` : undefined}
          type="text"
          inputMode={text ? "text" : "decimal"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
        />
        {unit && (
          <span className="input-unit" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      {(hint || unit) && (
        <small id={`${id}-help`} className={hint ? "" : "sr-only"}>
          {unit && <span className="sr-only">Enhet: {unit}. </span>}
          {hint}
        </small>
      )}
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) =>
          typeof o === "string" ? (
            <option key={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Heading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const els = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button, input, select, textarea, a[href]",
        ) ?? [],
      ).filter((el) => !(el as HTMLButtonElement).disabled);
    els()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const list = els(),
          first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Lukk dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Empty({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
