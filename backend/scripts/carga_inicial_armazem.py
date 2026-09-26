"""Carga inicial do catálogo do Armazém.

Uso seguro (padrão = simulação):
    python scripts/carga_inicial_armazem.py
    python scripts/carga_inicial_armazem.py --apply

O script é idempotente: materiais/tamanhos existentes não são duplicados.
Não altera estoque físico nem estoque mínimo de registros existentes.
Novos registros começam com estoque físico e mínimo iguais a zero.
"""
from __future__ import annotations

import argparse
import re
import unicodedata
from collections import defaultdict

from app.database import SessionLocal
from app.models.material import Material, MaterialTamanho


MATERIAIS = [
    "Luvas",
    "Luvas de Cabedal",
    "Bomba de massa",
    "Discos de corte de betão",
    "Discos de corte de aço",
    "Viseira",
    "Escovas de arame",
    "Óculos de corte de segurança",
    "Caixa eletrodos",
    "Capacete",
    "Máscara pó",
    "Óleo mistura",
    "Fita 5M",
    "Fita 60M",
    "Rackelete",
    "Bombones",
    "Liçosas de mão",
    "Liçosas de colagem",
    "Pó azul 4KG",
    "Tubo de massa consistente",
    "Abafadores",
    "Filtro moto serra",
    "Óleo 10W40",
    "Óleo 5W30",
    "Linhas azuis",
    "Fio de alinhar",
    "Cabo c/bicha acelerador",
    "Acelerador máquinas",
    "Pincéis",
    "Filtros moto disco",
    "Maceta",
    "Martelo",
    "Vela NGK BKR5ES",
    "Vela B6HS",
    "Vela BP5ES",
    "Vela BPMR7A",
    "Vela CMR5H",
    "Filtro P822858",
    "Filtro P821575",
    "Filtro P535396",
    "Filtro P822886",
    "Filtro Honda redondo",
    "Liçosas de 60",
    "Liçosas de 75",
    "Liçosas de 90",
    "Liçosas de 120",
    "Combis 90",
    "Combis 120",
    "Talochas 90",
    "Talochas 120",
    "Discos de 60",
    "Discos de 75",
    "Discos de 90",
    "Discos de 120 de 4 braços",
    "Discos de 120 de 5 braços",
]

BOTAS = {
    "Botas de Segurança": ["40", "41", "42", "43", "44", "45", "46", "47"],
    "Botas de Água": ["39", "40", "41", "42", "43", "44", "45", "46", "47"],
}


def chave_nome(valor: str) -> str:
    valor = " ".join(valor.strip().split()).casefold()
    return "".join(
        c for c in unicodedata.normalize("NFKD", valor)
        if not unicodedata.combining(c)
    )


def unidade_padrao(nome: str) -> str:
    # Botas são pares; os demais itens da planilha não informam unidade,
    # portanto entram como unidade genérica e podem ser ajustados no cadastro.
    return "par" if nome in BOTAS else "un"


def executar(aplicar: bool) -> int:
    db = SessionLocal()
    try:
        existentes = db.query(Material).all()
        por_chave: dict[str, list[Material]] = defaultdict(list)
        for material in existentes:
            por_chave[chave_nome(material.nome)].append(material)

        duplicados_existentes = {k: v for k, v in por_chave.items() if len(v) > 1}
        if duplicados_existentes:
            print("ERRO: há materiais existentes com nomes equivalentes; carga cancelada por segurança:")
            for itens in duplicados_existentes.values():
                print("  - " + " | ".join(f"#{m.id} {m.nome}" for m in itens))
            return 2

        criados = 0
        ignorados = 0
        tamanhos_criados = 0
        atualizados_para_tamanho = 0

        catalogo = [(nome, None) for nome in MATERIAIS] + list(BOTAS.items())
        for nome, tamanhos in catalogo:
            chave = chave_nome(nome)
            material = por_chave.get(chave, [None])[0]

            if material is None:
                print(f"CRIAR material: {nome} [{unidade_padrao(nome)}]")
                criados += 1
                if aplicar:
                    material = Material(
                        nome=nome,
                        unidade=unidade_padrao(nome),
                        estoque_fisico=0,
                        estoque_minimo=0,
                        controla_tamanho=bool(tamanhos),
                        is_active=True,
                    )
                    db.add(material)
                    db.flush()
                    por_chave[chave] = [material]
            else:
                print(f"MANTER material existente: #{material.id} {material.nome}")
                ignorados += 1
                if tamanhos and not material.controla_tamanho:
                    print("  ATIVAR controle por tamanho (sem alterar estoque existente)")
                    atualizados_para_tamanho += 1
                    if aplicar:
                        material.controla_tamanho = True

            if tamanhos:
                tamanhos_existentes = set()
                if material is not None:
                    tamanhos_existentes = {str(t.tamanho).strip() for t in material.tamanhos}
                for tamanho in tamanhos:
                    if tamanho in tamanhos_existentes:
                        print(f"  MANTER tamanho {tamanho}")
                        continue
                    print(f"  CRIAR tamanho {tamanho}")
                    tamanhos_criados += 1
                    if aplicar:
                        db.add(MaterialTamanho(
                            material_id=material.id,
                            tamanho=tamanho,
                            estoque_fisico=0,
                            estoque_minimo=0,
                        ))

        print("\nResumo:")
        print(f"  Materiais novos: {criados}")
        print(f"  Materiais já existentes: {ignorados}")
        print(f"  Materiais existentes ativados para tamanho: {atualizados_para_tamanho}")
        print(f"  Tamanhos novos: {tamanhos_criados}")

        if aplicar:
            db.commit()
            print("\nCARGA APLICADA COM SUCESSO.")
        else:
            db.rollback()
            print("\nDRY-RUN: nenhuma alteração foi gravada.")
            print("Para aplicar após conferir o resumo, execute novamente com --apply.")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Carga inicial idempotente do catálogo do Armazém")
    parser.add_argument("--apply", action="store_true", help="grava a carga; sem esta opção apenas simula")
    args = parser.parse_args()
    return executar(args.apply)


if __name__ == "__main__":
    raise SystemExit(main())
