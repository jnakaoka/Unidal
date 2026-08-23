import re


def formatar_matricula(valor: str) -> str:
    """Prepara a matrícula para apresentação."""
    return " ".join(valor.strip().upper().split())


def normalizar_matricula(valor: str) -> str:
    """
    Gera a chave usada contra duplicidade.

    AA-00-BB, aa 00 bb e AA00BB resultam em AA00BB.
    """
    formatada = formatar_matricula(valor)

    return re.sub(
        r"[^A-Z0-9]",
        "",
        formatada,
    )


def validar_matricula(valor: str) -> str:
    formatada = formatar_matricula(valor)
    normalizada = normalizar_matricula(formatada)

    if not formatada:
        raise ValueError("A matrícula não pode estar vazia")

    if len(formatada) > 20:
        raise ValueError("A matrícula não pode exceder 20 caracteres")

    if len(normalizada) < 4:
        raise ValueError("A matrícula informada é inválida")

    if len(normalizada) > 15:
        raise ValueError("A matrícula normalizada é demasiado longa")

    return formatada