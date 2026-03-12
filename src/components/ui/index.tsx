"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent-light shadow-sm",
    secondary:
      "bg-white border border-border-default text-text-primary hover:bg-elevated shadow-sm",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-elevated",
    danger: "bg-bill-bg text-bill border border-bill-border hover:bg-red-100",
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-sm px-5 py-2.5 gap-2",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full bg-white border border-border-default rounded-2xl shadow-xl",
          "animate-slide-up sm:animate-scale-in",
          widths[size],
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[75vh]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border-subtle bg-elevated/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftContent,
  rightContent,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center bg-white border rounded-lg overflow-hidden transition-colors",
          error
            ? "border-bill"
            : "border-border-default focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20",
        )}
      >
        {leftContent && <span className="pl-3 text-text-muted text-sm">{leftContent}</span>}
        <input
          id={inputId}
          className={cn(
            "flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-sm px-3 py-2 outline-none",
            className,
          )}
          {...props}
        />
        {rightContent && <span className="pr-3 text-text-muted text-sm">{rightContent}</span>}
      </div>
      {error && <p className="text-xs text-bill">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full bg-white border border-border-default rounded-lg text-text-primary text-sm px-3 py-2",
          "outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors cursor-pointer",
          error && "border-bill",
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-bill">{error}</p>}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
      <span>
        {label && <span className="block text-sm text-text-primary">{label}</span>}
        {description && <span className="block text-xs text-text-muted mt-0.5">{description}</span>}
      </span>
    </label>
  );
}
