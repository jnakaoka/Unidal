import unicodedata


def limpar_espacos(valor: str) -> str:
    """Remove espaços externos e reduz espaços repetidos."""
    return " ".join(valor.split())


def normalizar_texto_busca(valor: str) -> str:
    """
    Normaliza texto para comparação:

    - remove espaços externos;
    - reduz espaços repetidos;
    - ignora maiúsculas e minúsculas;
    - ignora acentos;
    - preserva pontuação.
    """
    texto = limpar_espacos(valor).casefold()

    texto_decomposto = unicodedata.normalize("NFKD", texto)

    return "".join(
        caractere
        for caractere in texto_decomposto
        if not unicodedata.combining(caractere)
    )