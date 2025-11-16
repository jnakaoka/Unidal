import React, { useState, useEffect } from "react";
import api from "@/services/api";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

const ResetPassword: React.FC = () => {
  const q = useQuery();
  const token = q.get("token") || "";
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // se quiser validar token no load, pode chamar /auth/check-reset-token?token=...
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) { setError("Token inválido."); return; }
    if (next !== confirm) { setError("A confirmação não confere."); return; }
    if (next.length < 8) { setError("Use ao menos 8 caracteres."); return; }
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: next });
      setDone(true);
    } catch (e:any) {
      setError(e?.response?.data?.detail || "Falha ao redefinir a senha.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-800 rounded px-3 py-2 text-sm">
          Senha redefinida com sucesso.
        </div>
        <Link to="/login" className="text-blue-600 underline">Ir para o login</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Definir nova senha</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Nova senha</Label>
          <Input type="password" value={next} onChange={e=>setNext(e.target.value)} autoComplete="new-password"/>
        </div>
        <div>
          <Label>Confirmar nova senha</Label>
          <Input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password"/>
        </div>
        {error && <div className="text-sm text-red-700">{error}</div>}
        <div className="flex justify-end">
          <Button className="btn-bg-blue-500" disabled={busy}>{busy?"Salvando...":"Salvar"}</Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
