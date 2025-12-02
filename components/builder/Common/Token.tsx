'use client';

import * as React from 'react';
import clsx from 'clsx';

type BaseProps<T> = {
  label?: string;
  className?: string;
  value: T;
  onChange: (v: T) => void;
};

type StringOption = string;
type ObjectOption = { value: string; label: string };
type SelectOptions = Array<StringOption | ObjectOption>;

function isObjectOption(opt: StringOption | ObjectOption): opt is ObjectOption {
  return typeof opt === 'object' && opt !== null && 'value' in opt && 'label' in opt;
}

export function SelectToken({
  label, className, value, onChange, options,
}: BaseProps<string> & { options: SelectOptions }) {
  const [open, setOpen] = React.useState(false);
  const normalized = React.useMemo(() => {
    return options.map(opt => isObjectOption(opt) ? opt : ({ value: String(opt), label: String(opt) }));
  }, [options]);
  const display = React.useMemo(() => {
    const found = normalized.find(o => o.value === value);
    return found ? found.label : String(value ?? '');
  }, [normalized, value]);
  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <button
        className="px-2 py-1 rounded-full border bg-white hover:bg-gray-50 text-sm"
        onClick={() => setOpen(v => !v)}
      >
        {display}
      </button>
      {open && (
        <div className="absolute z-10 mt-8 rounded-md border bg-white shadow-lg p-1">
          {normalized.map(opt => (
            <button
              key={opt.value}
              className={clsx(
                'block px-3 py-1.5 text-left rounded hover:bg-gray-100 w-full',
                opt.value === value && 'bg-gray-50 font-medium'
              )}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function NumberToken({
  label, className, value, onChange, step = 1, min, max,
}: BaseProps<number> & { step?: number; min?: number; max?: number }) {
  const [editing, setEditing] = React.useState(false);
  const [buf, setBuf] = React.useState(String(value ?? ''));
  React.useEffect(() => setBuf(String(value ?? '')), [value]);

  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {label && <span className="text-xs text-gray-500">{label}</span>}
      {editing ? (
        <input
          type="number"
          className="px-2 py-1 rounded-full border text-sm w-[92px]"
          step={step}
          min={min} max={max}
          value={buf}
          onChange={e => setBuf(e.target.value)}
          onBlur={() => { onChange(Number(buf)); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onChange(Number(buf)); setEditing(false); } }}
          autoFocus
        />
      ) : (
        <button
          className="px-2 py-1 rounded-full border bg-white hover:bg-gray-50 text-sm"
          onClick={() => setEditing(true)}
        >
          {value}
        </button>
      )}
    </div>
  );
}

export function TextToken({
  label, className, value, onChange, placeholder,
}: BaseProps<string> & { placeholder?: string }) {
  const [editing, setEditing] = React.useState(false);
  const [buf, setBuf] = React.useState(value ?? '');
  React.useEffect(() => setBuf(String(value ?? '')), [value]);

  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {label && <span className="text-xs text-gray-500">{label}</span>}
      {editing ? (
        <input
          className="px-2 py-1 rounded-full border text-sm w-[200px]"
          value={buf}
          placeholder={placeholder}
          onChange={e => setBuf(e.target.value)}
          onBlur={() => { onChange(buf); setEditing(false); }}
          onKeyDown={e => { if (e.key === 'Enter') { onChange(buf); setEditing(false); } }}
          autoFocus
        />
      ) : (
        <button
          className="px-2 py-1 rounded-full border bg-white hover:bg-gray-50 text-sm"
          onClick={() => setEditing(true)}
        >
          {value || (placeholder ?? '입력')}
        </button>
      )}
    </div>
  );
}

export function MultiToken({
  label, className, values, onChange, placeholder = '추가', addLabel = '추가',
}: { label?: string; className?: string; values: string[]; onChange: (vals: string[]) => void; placeholder?: string; addLabel?: string; }) {
  const [buf, setBuf] = React.useState('');
  const add = () => {
    const v = buf.trim();
    if (!v) return;
    onChange(Array.from(new Set([...values, v])));
    setBuf('');
  };
  const remove = (v: string) => onChange(values.filter(x => x !== v));
  return (
    <div className={clsx('inline-flex items-center gap-2 flex-wrap', className)}>
      {label && <span className="text-xs text-gray-500">{label}</span>}
      {values.map(v => (
        <span key={v} className="px-2 py-1 rounded-full border text-sm bg-gray-50">
          {v}
          <button className="ml-1 text-gray-500" onClick={() => remove(v)}>×</button>
        </span>
      ))}
      <input
        className="px-2 py-1 rounded-full border text-sm w-[140px]"
        placeholder={placeholder}
        value={buf}
        onChange={e => setBuf(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') add(); }}
      />
      <button className="px-2 py-1 rounded-full border text-sm" onClick={add}>{addLabel}</button>
    </div>
  );
}

export function ExpressionToken({
  label, className, value, onChange, placeholder, validationContext
}: BaseProps<string> & { placeholder?: string; validationContext?: 'condition' | 'variable' | 'formula' }) {
  const [buf, setBuf] = React.useState(value ?? '')
  const [validation, setValidation] = React.useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null)
  
  React.useEffect(() => setBuf(String(value ?? '')), [value])

  React.useEffect(() => {
    if (buf.trim() && typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('@/utils/dslValidator').then(({ validateDSL }) => {
        const result = validateDSL(buf, validationContext)
        setValidation(result)
      }).catch(() => {
        // Fallback if validation fails
        setValidation(null)
      })
    } else {
      setValidation(null)
    }
  }, [buf, validationContext])

  const hasErrors = validation && !validation.isValid
  const hasWarnings = validation && validation.warnings.length > 0

  return (
    <div className={clsx('inline-flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1">
        {label && <span className="text-xs text-gray-500">{label}</span>}
        {hasErrors && <span className="text-xs text-red-600">❌</span>}
        {!hasErrors && hasWarnings && <span className="text-xs text-yellow-600">⚠️</span>}
        {validation && validation.isValid && !hasWarnings && <span className="text-xs text-green-600">✓</span>}
      </div>
      <textarea
        className={clsx(
          "px-2 py-1 rounded-md border text-sm w-[260px] h-[80px]",
          hasErrors && "border-red-300 bg-red-50",
          !hasErrors && hasWarnings && "border-yellow-300 bg-yellow-50",
          validation && validation.isValid && !hasWarnings && "border-green-300 bg-green-50"
        )}
        placeholder={placeholder}
        value={buf}
        onChange={e => setBuf(e.target.value)}
        onBlur={() => onChange(buf)}
      />
      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="text-xs max-w-[260px]">
          {validation.errors.map((error, i) => (
            <div key={i} className="text-red-600">• {error}</div>
          ))}
          {validation.warnings.map((warning, i) => (
            <div key={i} className="text-yellow-600">• {warning}</div>
          ))}
        </div>
      )}
    </div>
  )
}