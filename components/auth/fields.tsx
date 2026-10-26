"use client";

import { forwardRef } from "react";

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-amz-deal">
      <span aria-hidden className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amz-deal text-[10px] font-bold text-white">
        !
      </span>
      {children}
    </p>
  );
}

export const TextField = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }>(
  function TextField({ label, error, hint, id, className = "", ...rest }, ref) {
    const fieldId = id ?? rest.name;
    return (
      <div className={className}>
        <label htmlFor={fieldId} className="mb-1 block text-[13px] font-bold">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={`h-[31px] w-full rounded-[3px] border px-2 text-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,.5),0_1px_0_rgba(0,0,0,.07)_inset] outline-none focus:border-[#e77600] focus:shadow-[0_0_3px_2px_rgba(228,121,17,.5)] ${
            error ? "border-amz-deal" : "border-[#a6a6a6] border-t-[#949494]"
          }`}
          {...rest}
        />
        {hint && !error && <p className="mt-1 text-xs text-amz-muted">{hint}</p>}
        <FieldError>{error}</FieldError>
      </div>
    );
  },
);

export function PrimaryButton({ children, pending, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[31px] w-full rounded-full bg-amz-yellow text-[13px] shadow-[0_2px_5px_rgba(213,217,217,.5)] hover:bg-amz-yellow-hover disabled:opacity-60"
      {...rest}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
