/* eslint-disable react/prop-types */
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
  className?: string;
  children?: React.ReactNode;
}

export type ToastActionElement = React.ReactElement;

export function Toast({
  open = true,
  onOpenChange,
  variant = "default",
  className,
  children,
}: ToastProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto w-full rounded-lg border bg-white shadow-lg",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-950"
          : "border-stone-200 text-stone-900",
        className
      )}
    >
      <div className="relative p-4 pr-10">{children}</div>
      <button
        type="button"
        onClick={() => onOpenChange?.(false)}
        className="absolute top-3 right-3 rounded p-1 text-stone-400 transition-colors hover:text-stone-700"
        aria-label="Close toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium", className)} {...props} />;
}

export function ToastDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-sm text-current/80", className)} {...props} />;
}

export function ToastAction({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "mt-3 inline-flex items-center rounded border border-current/20 px-3 py-1.5 text-xs tracking-[0.08em] uppercase transition-colors hover:bg-black/5",
        className
      )}
      {...props}
    />
  );
}

export function ToastViewport({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed top-24 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3",
        className
      )}
      {...props}
    />
  );
}
