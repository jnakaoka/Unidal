type CaptureError = {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: { detail?: unknown };
    headers?: Record<string, unknown>;
  };
};

export function faceCaptureError(error: CaptureError | null | undefined) {
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return {
      title: "Validação demorada",
      message: "A API não respondeu a tempo. A fotografia pode ter sido validada no servidor, mas o cadastro ainda não foi enviado. Tente novamente.",
    };
  }
  if (error?.message === "Sessão expirada. Volte a iniciar sessão.") {
    return { title: "Sessão expirada", message: error.message };
  }
  if (!error?.response) {
    return {
      title: "Falha de ligação",
      message: "Não foi possível contactar a API de testes. Verifique a ligação e se o servidor está ativo.",
    };
  }
  const { status, data, headers } = error.response;
  const detail = typeof data?.detail === "string" ? data.detail : null;
  const reference = headers?.["x-face-request-id"];
  const suffix = typeof reference === "string" && /^[a-f0-9]{12}$/.test(reference)
    ? ` Referência: ${reference}.` : "";
  if (status === 401) {
    return { title: "Sessão expirada", message: "Volte a iniciar sessão e repita a captura." };
  }
  if (status === 403) {
    return { title: "Sem permissão", message: "Entre com o administrador da API de testes para validar o rosto." };
  }
  if (status && status >= 500) {
    return { title: "API indisponível", message: (detail || "O servidor não conseguiu validar o rosto. Tente novamente.") + suffix };
  }
  return {
    title: "Captura rejeitada",
    message: (detail || "A fotografia não passou na validação. Repita com o rosto inteiro de frente e boa iluminação.") + suffix,
  };
}
