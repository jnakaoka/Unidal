# services/registro_hora.py
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from app.schemas.registro_hora import RegistroHoraCreate, RegistroHoraUpdate, RegistroHoraResponse
from app.models.registro_hora import RegistroHora, RegistroHoraEquipa
from app.models.obra import Obra
from app.models.user import User
from app.models.veiculo import Veiculo
from app.models.maquina import Maquina
from typing import Optional
from datetime import datetime, timezone


def _manobradores_opcoes(opcoes) -> list[dict]:
    if opcoes is None:
        return []
    if hasattr(opcoes, "model_dump"):
        opcoes = opcoes.model_dump()
    if not isinstance(opcoes, dict):
        return []
    manobradores = [m for m in opcoes.get("manobradores", []) if isinstance(m, dict)]
    for chave in (
        "laserComManobrador",
        "poComManobrador",
        "laserWS940CComManobrador",
        "lazerYZ30ComManobrador",
    ):
        detalhe = opcoes.get(chave)
        if isinstance(detalhe, dict) and detalhe.get("checked") and detalhe.get("manobrador_user_id"):
            manobradores.append({
                "user_id": detalhe["manobrador_user_id"],
                "opcao": chave,
                "m2": detalhe.get("m2", ""),
                "double_journey": bool(detalhe.get("double_journey", False)),
            })
    return manobradores


def _validar_manobradores(db: Session, opcoes) -> list[dict]:
    manobradores = _manobradores_opcoes(opcoes)
    opcoes_dict = opcoes.model_dump() if hasattr(opcoes, "model_dump") else (opcoes or {})
    vinculos: set[tuple[int, str]] = set()
    for item in manobradores:
        user_id = item.get("user_id")
        opcao = item.get("opcao")
        vinculo = (user_id, opcao)
        if vinculo in vinculos:
            raise HTTPException(
                status_code=422,
                detail="O mesmo manobrador não pode ser repetido na mesma opção de máquina.",
            )
        vinculos.add(vinculo)
        if not isinstance(opcoes_dict.get(opcao), dict) or not opcoes_dict[opcao].get("checked"):
            raise HTTPException(
                status_code=422,
                detail="A opção de máquina ligada ao manobrador precisa estar selecionada.",
            )
        funcionario = db.get(User, user_id)
        if not funcionario or not funcionario.is_active:
            raise HTTPException(status_code=422, detail="Manobrador inválido ou inativo.")
    return manobradores


def _validar_transporte(db: Session, data: dict) -> None:
    veiculo_id = data.get("transporte_veiculo_id")
    if veiculo_id:
        veiculo = db.get(Veiculo, veiculo_id)
        if not veiculo or not veiculo.ativo:
            raise HTTPException(status_code=422, detail="Veículo de transporte inválido ou inativo.")
    maquina_ids = data.get("transporte_maquina_ids") or []
    if len(set(maquina_ids)) != len(maquina_ids):
        raise HTTPException(status_code=422, detail="A mesma máquina não pode ser selecionada duas vezes.")
    if maquina_ids:
        total = db.query(Maquina).filter(Maquina.id.in_(maquina_ids), Maquina.ativo.is_(True)).count()
        if total != len(maquina_ids):
            raise HTTPException(status_code=422, detail="Existe uma máquina inválida ou inativa no transporte.")


def _validar_double_journey(
    db: Session,
    *,
    data,
    obra_id: int | None,
    participantes: list[tuple[int, bool, str]],
    registro_id: int | None = None,
):
    if obra_id is None:
        return

    for user_id, double_journey, papel in participantes:
        query = db.query(RegistroHora).filter(
            RegistroHora.data == data,
            RegistroHora.obra_id.isnot(None),
            RegistroHora.obra_id != obra_id,
        )
        if registro_id is not None:
            query = query.filter(RegistroHora.id != registro_id)

        for conflito in query.all():
            manobrador_conflitante = next(
                (item for item in _manobradores_opcoes(conflito.intervencao_maquinas_opcoes)
                 if item.get("user_id") == user_id),
                None,
            )
            participa_conflito = (
                conflito.usuario_id == user_id
                or any(item.user_id == user_id for item in conflito.equipa)
                or manobrador_conflitante is not None
            )
            if not participa_conflito:
                continue
            membro_conflitante = next(
                (
                    item for item in conflito.equipa
                    if item.user_id == user_id
                ),
                None,
            )
            conflito_marcado = (
                conflito.usuario_id == user_id
                and conflito.double_journey_lider
            ) or bool(
                membro_conflitante
                and membro_conflitante.double_journey
            ) or bool(
                manobrador_conflitante
                and manobrador_conflitante.get("double_journey", False)
            )

            if not double_journey and not conflito_marcado:
                funcionario = db.get(User, user_id)
                nome = funcionario.name if funcionario else f"ID {user_id}"
                obra = conflito.obra or db.get(Obra, conflito.obra_id)
                obra_nome = obra.nome if obra else f"ID {conflito.obra_id}"
                sujeito = (
                    f"O chefe de equipa {nome}"
                    if papel == "lider"
                    else f"O funcionário {nome}"
                )
                instrucao = (
                    "Marque Double Journey do chefe de equipa"
                    if papel == "lider"
                    else f"Marque Double Journey para {nome}"
                )
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"{sujeito} já está registado na obra {obra_nome} "
                        f"em {data.strftime('%d/%m/%Y')}. {instrucao} para "
                        "autorizar o segundo apontamento."
                    ),
                )

def _validate_cliente_obra(db: Session, cliente_id: int, obra_id: int):
    obra = db.query(Obra).filter(Obra.id == obra_id).first()
    if not obra:
        raise Exception("Obra inválida")
    if obra.cliente_id != cliente_id:
        raise Exception("Obra não pertence ao cliente informado")

def criar_registro_hora(db: Session, registro: RegistroHoraCreate):
    print("criar_registro_hora", registro)
    # novo_registro = RegistroHora(
    #     projeto_id=registro.projeto_id,
    #     usuario_id=registro.usuario_id,
    #     data=registro.data,
    #     horas=registro.horas,
    #     cliente_id=registro.cliente_id,
    #     obra_id=registro.obra_id,
    #     # cliente=registro.cliente,
    #     # obra=registro.obra,
    #     metros_quadrados=registro.metros_quadrados,
    #     preparacao=registro.preparacao,
    #     bruto=registro.bruto,
    #     colagem=registro.colagem,
    #     acabamento=registro.acabamento,
    #     serragem=registro.serragem,
    #     intervencao_maquinas=registro.intervencao_maquinas,
    #     intervencao_maquinas_opcoes=(
    #         registro.intervencao_maquinas_opcoes.model_dump()
    #         if registro.intervencao_maquinas_opcoes else None
    #     ),
    # )

    # print(novo_registro)
    # db.add(novo_registro)
    # db.commit()
    # db.refresh(novo_registro)

    # for membro in registro.equipa:
    #     db.add(RegistroHoraEquipa(user_id=membro.user_id, registro_id=novo_registro.id))

    # db.commit()
    # db.refresh(novo_registro)
    # return RegistroHoraResponse.from_orm(novo_registro)
    #return novo_registro

    # NÃO incluir 'cliente'/'obra' no dict; só colunas
    data = registro.model_dump(exclude_none=True)
    # o dict acima já tem cliente_id/obra_id (sem os objetos)

    # Se sua coluna for JSON, passe dict; se for TEXT, serialize
    if data.get("intervencao_maquinas_opcoes") is not None:
        data["intervencao_maquinas_opcoes"] = data["intervencao_maquinas_opcoes"]  # dict puro
    # else: deixe como None (evita 'null' string)

    equipa_payload = data.pop("equipa", [])  # tratar fora
    _validar_transporte(db, data)
    manobradores_payload = _validar_manobradores(
        db, data.get("intervencao_maquinas_opcoes")
    )

    participantes = [
        (registro.usuario_id, registro.double_journey_lider, "lider")
    ]
    participantes.extend(
        (m["user_id"], bool(m.get("double_journey", False)), "equipa")
        for m in equipa_payload
    )
    participantes.extend(
        (m["user_id"], bool(m.get("double_journey", False)), "manobrador")
        for m in manobradores_payload
    )
    _validar_double_journey(
        db,
        data=registro.data,
        obra_id=registro.obra_id,
        participantes=participantes,
    )

    data["modificado_por"] = None
    data["modificado_em"] = None

    reg = RegistroHora(**data)
    db.add(reg)
    db.flush()  # garante reg.id

    for m in equipa_payload:
        db.add(RegistroHoraEquipa(
            registro_id=reg.id, 
            user_id=m["user_id"],
            intemperie=bool(m.get("intemperie", False)),
            double_journey=bool(m.get("double_journey", False)),
        ))

    db.commit()
    db.refresh(reg)
    return reg


# def listar_registros_horas(db: Session):
#     registros = db.query(RegistroHora)\
#         .options(
#             joinedload(RegistroHora.user),
#             joinedload(RegistroHora.projeto),
#             joinedload(RegistroHora.cliente),
#             joinedload(RegistroHora.obra),
#             joinedload(RegistroHora.equipa).joinedload(RegistroHoraEquipa.user)
#         ).order_by(RegistroHora.data.desc()).all()
    
#     print('lista registos',[RegistroHoraResponse.from_orm(reg) for reg in registros])

#     # Converte ORM → Schema Pydantic
#     return [RegistroHoraResponse.from_orm(reg) for reg in registros]

def listar_registros_horas(db: Session, usuario_id: Optional[int] = None):
    q = (
        db.query(RegistroHora)
        .options(
            joinedload(RegistroHora.user),
            joinedload(RegistroHora.usuario_modificador),
            joinedload(RegistroHora.projeto),
            joinedload(RegistroHora.cliente),
            joinedload(RegistroHora.obra),
            joinedload(RegistroHora.equipa).joinedload(RegistroHoraEquipa.user),
        )
        .order_by(RegistroHora.data.desc())
    )
    print("usuario_id", usuario_id)
    if isinstance(usuario_id, int):  # só filtra se for int válido
        q = q.filter(RegistroHora.usuario_id == usuario_id)

    regs = q.all()
    return [RegistroHoraResponse.from_orm(reg) for reg in regs]


# def listar_registros_horas(db: Session):
#     return db.query(RegistroHora)\
#         .options(
#             joinedload(RegistroHora.user),
#             joinedload(RegistroHora.projeto),
#             joinedload(RegistroHora.equipa).joinedload(RegistroHoraEquipa.user)
#         ).all()


def atualizar_registro_hora(db: Session, registro_id: int, registro: RegistroHoraUpdate):
    reg = db.get(RegistroHora, registro_id)
    if not reg:
        raise Exception(status_code=404, detail="Registro não encontrado")

    data = registro.model_dump(exclude_none=True)
    equipa_payload = data.pop("equipa", None)
    _validar_transporte(db, data)
    manobradores_payload = _validar_manobradores(
        db, data.get("intervencao_maquinas_opcoes")
    )

    mod_por = data.pop("modificado_por", None)

    equipa_para_validacao = equipa_payload if equipa_payload is not None else [
        {
            "user_id": membro.user_id,
            "double_journey": membro.double_journey,
        }
        for membro in reg.equipa
    ]
    participantes = [
        (reg.usuario_id, registro.double_journey_lider, "lider")
    ]
    participantes.extend(
        (m["user_id"], bool(m.get("double_journey", False)), "equipa")
        for m in equipa_para_validacao
    )
    participantes.extend(
        (m["user_id"], bool(m.get("double_journey", False)), "manobrador")
        for m in manobradores_payload
    )
    _validar_double_journey(
        db,
        data=registro.data,
        obra_id=registro.obra_id,
        participantes=participantes,
        registro_id=registro_id,
    )

    # segurança absoluta: NÃO deixar que alterem usuario_id via update
    if "usuario_id" in data:
        data.pop("usuario_id")

    # Atualiza campos simples
    for k, v in data.items():
        setattr(reg, k, v)

    reg.modificado_por = mod_por
    reg.modificado_em  = datetime.now(timezone.utc)

    # (Re)grava equipa se vier no update
    if equipa_payload is not None:
        db.query(RegistroHoraEquipa).filter_by(registro_id=reg.id).delete()
        for m in equipa_payload:
            db.add(RegistroHoraEquipa(
                registro_id=reg.id, 
                user_id=m["user_id"],
                intemperie=bool(m.get("intemperie", False)),
                double_journey=bool(m.get("double_journey", False)),
            ))

    db.commit()
    db.refresh(reg)
    return reg
    
    # db_registro = db.query(RegistroHora).filter(RegistroHora.id == registro_id).first()
    # if not db_registro:
    #     raise Exception("Registro de horas não encontrado")

    # data = registro.model_dump(exclude_unset=True)
    # if "intervencao_maquinas_opcoes" in data and data["intervencao_maquinas_opcoes"] is not None:
    #     data["intervencao_maquinas_opcoes"] = data["intervencao_maquinas_opcoes"]

    # for field, value in registro.dict(exclude_unset=True).items():
    #     if field != "equipa":
    #         setattr(db_registro, field, value)
    # print(db_registro)
    # print(data)
    # db.commit()

    # db.query(RegistroHoraEquipa).filter(RegistroHoraEquipa.registro_id == registro_id).delete()
    # db.commit()
    # for membro in registro.equipa:
    #     db.add(RegistroHoraEquipa(user_id=membro.user_id, registro_id=registro_id))
    # db.commit()

    # db.refresh(db_registro)
    # return RegistroHoraResponse.from_orm(db_registro)
    #return db_registro

def deletar_registro_hora(db: Session, registro_id: int):
    db_registro = db.query(RegistroHora).filter(RegistroHora.id == registro_id).first()
    if not db_registro:
        raise Exception("Registro de horas nao encontrado")

    db.delete(db_registro)
    db.commit()
    return db_registro


# # app/services/registro_hora.py
# from sqlalchemy.orm import Session
# from app.models.registro_hora import RegistroHora
# from app.schemas.registro_hora import RegistroHoraCreate
# from app.schemas.registro_hora import RegistroHoraUpdate
# from app.models.registro_hora_equipa import registro_hora_equipa
# from sqlalchemy import insert, delete, update  # Remova o "where"
# from datetime import date
# from fastapi import HTTPException
# from app.models.user import User


# def get_all(db: Session):
#     return db.query(RegistroHora).all()

# def get_by_id(db: Session, registro_id: int):
#     return db.query(RegistroHora).filter(RegistroHora.id == registro_id).first()

# def create(db: Session, registro_data: RegistroHoraCreate):
#     # Cria o registro principal
#     equipa_ids = registro_data.equipa  # extrai os IDs da equipa
#     data_dict = registro_data.dict()
#     data_dict.pop("equipa")  # Remove equipa antes de passar pro model

#     print("Dados que serão usados para criar RegistroHora:", data_dict)

#     novo_registro = RegistroHora(**data_dict)
#     db.add(novo_registro)
#     db.commit()
#     db.refresh(novo_registro)

#     print(equipa_ids)

#     # Adiciona os usuários na tabela associativa
#     for user_id in equipa_ids:
#         stmt = insert(registro_hora_equipa).values(
#             registro_id=novo_registro.id,
#             user_id=user_id
#         )
#         print(stmt)
#         db.execute(stmt)


#     db.commit()
#     db.refresh(novo_registro)
#     return novo_registro

# # def create(db: Session, registro_data: RegistroHoraCreate):
# #     novo_registro = RegistroHora(**registro_data.dict())
# #     db.add(novo_registro)
# #     db.commit()
# #     db.refresh(novo_registro)
# #     return novo_registro

# # def delete(db: Session, registro_id: int):
# #     registro = get_by_id(db, registro_id)
# #     if registro:
# #         db.delete(registro)
# #         db.commit()
# #     return registro

# def delete_registro(db: Session, registro_id: int):
#     registro = get_by_id(db, registro_id)
#     if not registro:
#         return None

#     # Remove registros da tabela associativa
#     stmt_delete_equipa = delete(registro_hora_equipa).where(registro_hora_equipa.c.registro_id == registro_id)
#     db.execute(stmt_delete_equipa)

#     # Agora sim remove o registro principal
#     db.delete(registro)
#     db.commit()
#     return registro

# def update_registro_hora(db: Session, registro_id: int, registro_data: RegistroHoraUpdate):
#     db_registro = get_by_id(db, registro_id)
#     if not db_registro:
#         raise HTTPException(status_code=404, detail="Registro de hora não encontrado")

#     print("Registro ID", registro_id)
#     print("Registro Data", registro_data)
#     # Atualiza campos do RegistroHora (exceto equipa)

#     equipa_objs = registro_data.equipa  # Lista de objetos com user_id
#     equipa_ids = [item.user_id for item in equipa_objs]

#     data_dict = registro_data.dict()
#     data_dict.pop("equipa")
#     print("Nova Equipa IDs", equipa_ids)

#     # Atualiza os outros campos
#     for key, value in data_dict.items():
#         setattr(db_registro, key, value)

#     # Atualiza a equipa (se enviado)
#     if equipa_ids is not None:
#         nova_equipa_objs = db.query(User).filter(User.id.in_(equipa_ids)).all()
#         db_registro.equipa = nova_equipa_objs

#     db.commit()
#     db.refresh(db_registro)
#     return db_registro

# #update v3
# # def update_registro_hora(
# #     db: Session,
# #     registro_id: int,
# #     registro_update: RegistroHoraUpdate
# # ):
# #     registro = get_registro_hora_by_id(db, registro_id)
# #     if not registro:
# #         raise HTTPException(status_code=404, detail="Registro não encontrado")

# #     for field, value in registro_update.dict(exclude_unset=True).items():
# #         setattr(registro, field, value)

# #     # Atualiza o relacionamento com a equipe
# #     if registro_update.equipa:
# #         data_dict = registro_update.dict(exclude_unset=True)
# #         nova_equipa_ids = data_dict.pop("equipa", None)
# #         usuarios_equipa = db.query(User).filter(User.id.in_(User.id.in_(nova_equipa_ids))).all()
# #         registro.equipe = usuarios_equipa
# #     else:
# #         registro.equipe = []

# #     try:
# #         print("🔄 Dados para atualizar registro:", registro_update.dict())
# #         db.commit()
# #         print("✅ Registro atualizado com sucesso:", registro.id)
# #     except Exception as e:
# #         db.rollback()
# #         print("❌ Erro ao salvar no banco de dados:", e)
# #         raise HTTPException(status_code=500, detail="Erro ao salvar no banco de dados")

# #     db.refresh(registro)
# #     return registro


# def get_registro_hora_by_id(db, registro_id):
#     return db.query(RegistroHora).filter(RegistroHora.id == registro_id).first()

# # update v2
# # def update(db: Session, registro_id: int, registro_data: RegistroHoraCreate):
# #     db_registro = get_by_id(db, registro_id)
# #     if not db_registro:
# #         return None

# #     print(registro_id)
# #     # Atualiza campos do RegistroHora (exceto equipa)
# #     data_dict = registro_data.dict()
# #     nova_equipa = data_dict.pop("equipa", [])

# #     print(data_dict)
# #     print(nova_equipa)

# #     if 'data' in data_dict and isinstance(data_dict['data'], str):
# #         data_dict['data'] = date.fromisoformat(data_dict['data'])

# #     for key, value in data_dict.items():
# #         setattr(db_registro, key, value)

# #     db.add(db_registro)
# #     try:
# #         db.commit()
# #     except Exception as e:
# #         print("❌ Erro no commit:", e)
# #         db.rollback()
# #         raise e

# #     # Remove membros antigos da equipa
# #     stmt_delete = delete(registro_hora_equipa).where(registro_hora_equipa.c.registro_id == registro_id)
# #     db.execute(stmt_delete)

# #     # Insere nova equipa
# #     for user_id in nova_equipa:
# #         stmt_insert = insert(registro_hora_equipa).values(registro_id=registro_id, user_id=user_id)
# #         print(stmt_insert)
# #         db.execute(stmt_insert)

# #     db.commit()
# #     db.refresh(db_registro)
# #     return db_registro

# # def update(db: Session, registro_id: int, registro_data: RegistroHoraCreate):
# #     db_registro = get_by_id(db, registro_id)
# #     if db_registro:
# #         for key, value in registro_data.dict().items():
# #             setattr(db_registro, key, value)
# #         db.commit()
# #         db.refresh(db_registro)
# #     return db_registro
