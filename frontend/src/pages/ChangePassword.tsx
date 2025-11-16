// frontend/src/pages/ChangePassword.tsx
import React, { useEffect, useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

// tipagem mínima dos usuários pra listagem admin
type UserItem = {
  id: number;
  name: string;
  email?: string;
  perfil?: { nome?: string } | string; // porque às vezes vem perfil.nome, às vezes perfil_nome
};

const ChangePassword: React.FC = () => {
  const { user } = useAuth();

  // -----------------------
  // helpers de role
  // -----------------------
  // tenta normalizar o perfil do usuário atual
  const rawPerfil =
    (user as any)?.perfil?.nome ??
    (user as any)?.perfil_nome ??
    (user as any)?.perfil ??
    "";

  const perfilLower = String(rawPerfil).trim().toLowerCase();
  const isOperador = perfilLower === "operador";
  const isAdmin    = perfilLower === "admin" || perfilLower === "administrador";

  // -----------------------
  // bloco "minha senha"
  // -----------------------
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busySelf, setBusySelf] = useState(false);

  // -----------------------
  // bloco "admin reseta senha de operador"
  // -----------------------
  const [operadores, setOperadores] = useState<UserItem[]>([]);
  const [targetUserId, setTargetUserId] = useState<number | "">("");
  const [newForOperador, setNewForOperador] = useState("");
  const [confirmForOperador, setConfirmForOperador] = useState("");
  const [busyAdmin, setBusyAdmin] = useState(false);

  // mensagem geral (mostra uma vez de cada ação)
  const [msg, setMsg] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // carrega lista de operadores se for admin
  useEffect(() => {
    if (!isAdmin) return;

    (async () => {
      try {
        const { data } = await api.get<UserItem[]>("/users/");
        // filtra só operadores
        const onlyOps = data.filter((u) => {
          const raw =
            (u as any)?.perfil?.nome ??
            (u as any)?.perfil_nome ??
            (u as any)?.perfil ??
            "";
          const role = String(raw).trim().toLowerCase();
          return role === "operador";
        });

        // ordena alfabeticamente
        onlyOps.sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt"));

        setOperadores(onlyOps);
      } catch (err) {
        console.error("Erro ao buscar operadores:", err);
        setOperadores([]);
      }
    })();
  }, [isAdmin]);

  // -----------------------
  // validações de senha
  // -----------------------
  function validatePasswordRules(pwd: string) {
    if (pwd.length < 8) return "Use ao menos 8 caracteres.";
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd))
      return "Inclua maiúscula, minúscula e número.";
    return null;
  }

  // validação do bloco "minha senha"
  function validateSelf() {
    if (!current || !next || !confirm)
      return "Preencha todos os campos.";
    if (next !== confirm)
      return "A confirmação não confere.";
    const ruleErr = validatePasswordRules(next);
    if (ruleErr) return ruleErr;
    return null;
  }

  // validação do bloco "admin troca senha de operador"
  function validateAdmin() {
    if (!targetUserId) return "Selecione um operador.";
    if (!newForOperador || !confirmForOperador)
      return "Informe e confirme a nova senha.";
    if (newForOperador !== confirmForOperador)
      return "A confirmação não confere.";
    const ruleErr = validatePasswordRules(newForOperador);
    if (ruleErr) return ruleErr;
    return null;
  }

  // -----------------------
  // submit "minha senha"
  // -----------------------
  async function handleSubmitSelf(e: React.FormEvent) {
    e.preventDefault();
    const err = validateSelf();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    setBusySelf(true);
    try {
      await api.post("/auth/change-password", {
        current_password: current,
        new_password: next,
      });

      setMsg({ type: "success", text: "Senha alterada com sucesso." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e?.response?.data?.detail || "Falha ao alterar senha.",
      });
    } finally {
      setBusySelf(false);
    }
  }

  // -----------------------
  // submit "admin troca senha de operador"
  // -----------------------
  async function handleSubmitAdmin(e: React.FormEvent) {
    e.preventDefault();
    const err = validateAdmin();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    setBusyAdmin(true);
    try {
      // endpoint sugerido; ajuste pro seu backend real
      await api.post("/auth/admin-reset-password", {
        user_id: targetUserId,
        new_password: newForOperador,
      });

      setMsg({
        type: "success",
        text: "Senha do operador atualizada com sucesso.",
      });
      setTargetUserId("");
      setNewForOperador("");
      setConfirmForOperador("");
    } catch (e: any) {
      setMsg({
        type: "error",
        text:
          e?.response?.data?.detail ||
          "Falha ao alterar senha do operador.",
      });
    } finally {
      setBusyAdmin(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold text-gray-800">Gestão de Senhas</h2>

      {msg && (
        <div
          className={`border rounded px-3 py-2 text-sm ${
            msg.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : msg.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* BLOCO 1: alterar a própria senha (sempre visível) */}
      <section className="bg-white rounded-xl shadow p-4 space-y-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">
          Alterar minha senha
        </h3>

        <form onSubmit={handleSubmitSelf} className="space-y-4">
          <div>
            <Label>Senha atual</Label>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              disabled={busySelf}
            />
          </div>

          <div>
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              disabled={busySelf}
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres, com maiúscula, minúscula e número.
            </p>
          </div>

          <div>
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={busySelf}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              className="btn-bg-blue-500"
              disabled={busySelf}
              aria-busy={busySelf}
            >
              {busySelf ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </section>

      {/* BLOCO 2: admin redefine senha de operador (só aparece se admin) */}
      {isAdmin && (
        <section className="bg-white rounded-xl shadow p-4 space-y-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">
            Redefinir senha de um operador
          </h3>

          <p className="text-xs text-gray-500 -mt-2">
            Escolha um operador e defina uma nova senha para ele. Não é
            necessário informar a senha atual do operador.
          </p>

          <form onSubmit={handleSubmitAdmin} className="space-y-4">
            <div>
              <Label>Operador</Label>
              <select
                className="border rounded px-3 py-2 w-full bg-white"
                value={targetUserId}
                onChange={(e) =>
                  setTargetUserId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={busyAdmin || operadores.length === 0}
              >
                <option value="">Selecione um operador</option>
                {operadores.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name} {op.email ? `(${op.email})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Nova senha do operador</Label>
              <Input
                type="password"
                value={newForOperador}
                onChange={(e) => setNewForOperador(e.target.value)}
                disabled={busyAdmin}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, com maiúscula, minúscula e número.
              </p>
            </div>

            <div>
              <Label>Confirmar nova senha do operador</Label>
              <Input
                type="password"
                value={confirmForOperador}
                onChange={(e) => setConfirmForOperador(e.target.value)}
                disabled={busyAdmin}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                className="btn-bg-blue-500"
                disabled={busyAdmin}
                aria-busy={busyAdmin}
              >
                {busyAdmin ? "Salvando..." : "Redefinir senha"}
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export default ChangePassword;
