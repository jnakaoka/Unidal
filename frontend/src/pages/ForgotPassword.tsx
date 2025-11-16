import React, { useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (e:any) {
      setError(e?.response?.data?.detail || "Não foi possível enviar o e-mail.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Recuperar senha</h2>

      {sent ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded px-3 py-2 text-sm">
          Se existir uma conta para <b>{email}</b>, enviamos um e-mail com instruções.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          {error && <div className="text-sm text-red-700">{error}</div>}
          <div className="flex justify-end">
            <Button className="btn-bg-blue-500" disabled={busy}>
              {busy ? "Enviando..." : "Enviar link"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
