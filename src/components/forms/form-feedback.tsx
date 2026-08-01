import { AlertCircle, CheckCircle2 } from "lucide-react";

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="text-xs text-destructive" role="alert">
      {messages[0]}
    </p>
  );
}

export function FormAlert({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;

  const isError = Boolean(error);
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          : "flex gap-2 rounded-xl border border-positive/30 bg-positive/10 p-3 text-sm text-positive"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{error ?? success}</span>
    </div>
  );
}
