"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  details?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger,
  loading,
  details,
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div className="flex gap-3">
            <div className={`mt-1 rounded-full p-2 ${danger ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-950">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{message}</p>
            </div>
          </div>
          <button className="rounded-md p-1 text-slate-500 hover:bg-slate-100" onClick={onCancel} disabled={loading}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {details ? <div className="border-b border-slate-200 p-4 text-sm text-slate-700">{details}</div> : null}
        <div className="flex justify-end gap-2 p-4">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={loading}>
            {loading ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
