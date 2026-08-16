import re


def formatar_identificador(valor: str) -> str:
    """Limpa espaços e padroniza letras do identificador."""
    return " ".join(valor.strip().upper().split())


def normalizar_identificador(valor: str) -> str:
    """Gera a chave usada para comparação de identificadores."""
    formatado = formatar_identificador(valor)
    return re.sub(r"[^A-Z0-9]", "", formatado)


def validar_identificador(valor: str) -> str:
    """Valida e formata o identificador exibido no sistema."""
    formatado = formatar_identificador(valor)
    normalizado = normalizar_identificador(formatado)

    if not formatado:
        raise ValueError(
            "O identificador não pode estar vazio"
        )

    if len(formatado) > 50:
        raise ValueError(
            "O identificador não pode exceder 50 caracteres"
        )

    if len(normalizado) < 2:
        raise ValueError(
            "O identificador informado é inválido"
        )

    return formatado