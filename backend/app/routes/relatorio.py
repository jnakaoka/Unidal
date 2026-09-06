from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import RegistroHora, User, Projeto
from app.schemas.relatorio import DiasTrabalhadosOut, DoubleJourneyOut, RegistroHoraOut
from app.dependencies.auth import require_role
from typing import List, Optional
from datetime import date

router = APIRouter()


@router.get("/dias-trabalhados", response_model=DiasTrabalhadosOut)
def relatorio_dias_trabalhados(
    funcionario_id: int = Query(..., gt=0),
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin")),
):
    if data_inicio > data_fim:
        raise HTTPException(
            status_code=422,
            detail="A data inicial não pode ser posterior à data final.",
        )

    funcionario = db.query(User).filter(User.id == funcionario_id).first()
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado.")

    registros_periodo = (
        db.query(RegistroHora)
        .options(
            joinedload(RegistroHora.obra),
            joinedload(RegistroHora.equipa),
        )
        .filter(
            RegistroHora.data.between(data_inicio, data_fim),
        )
        .all()
    )
    registros = []
    for registro in registros_periodo:
        manobradores = (
            (registro.intervencao_maquinas_opcoes or {}).get("manobradores", [])
            if isinstance(registro.intervencao_maquinas_opcoes, dict)
            else []
        )
        participa = (
            registro.usuario_id == funcionario_id
            or any(item.user_id == funcionario_id for item in registro.equipa)
            or any(item.get("user_id") == funcionario_id for item in manobradores)
        )
        if participa:
            registros.append(registro)

    datas_trabalhadas = sorted({registro.data for registro in registros})
    por_data: dict[date, dict] = {}
    for registro in registros:
        membro = next(
            (
                item for item in registro.equipa
                if item.user_id == funcionario_id
            ),
            None,
        )
        marcado = (
            registro.usuario_id == funcionario_id
            and registro.double_journey_lider
        ) or bool(membro and membro.double_journey) or any(
            item.get("user_id") == funcionario_id
            and item.get("double_journey", False)
            for item in (
                (registro.intervencao_maquinas_opcoes or {}).get("manobradores", [])
                if isinstance(registro.intervencao_maquinas_opcoes, dict)
                else []
            )
        )
        grupo = por_data.setdefault(
            registro.data,
            {"marcado": False, "obras": set()},
        )
        grupo["marcado"] = grupo["marcado"] or marcado
        grupo["obras"].add(
            registro.obra.nome if registro.obra else "Obra não informada"
        )

    double_journeys = [
        DoubleJourneyOut(data=data_registro, obras=sorted(info["obras"]))
        for data_registro, info in sorted(por_data.items())
        if info["marcado"] and len(info["obras"]) > 1
    ]

    return DiasTrabalhadosOut(
        funcionario_id=funcionario.id,
        funcionario_nome=funcionario.name,
        empresa=funcionario.empresa,
        data_inicio=data_inicio,
        data_fim=data_fim,
        total_dias=len(datas_trabalhadas),
        datas_trabalhadas=datas_trabalhadas,
        total_double_journeys=len(double_journeys),
        double_journeys=double_journeys,
    )

@router.get("/", response_model=List[RegistroHoraOut])
def relatorio_por_projeto_operador(
    projeto_id: Optional[int] = Query(None),
    operador_id: Optional[int] = Query(None),
    data_inicio: Optional[date] = Query(None),
    data_fim: Optional[date] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(RegistroHora)

    if projeto_id:
        query = query.filter(RegistroHora.projeto_id == projeto_id)
    if operador_id:
        query = query.filter(RegistroHora.usuario_id == operador_id)
    if data_inicio:
        query = query.filter(RegistroHora.data >= data_inicio)
    if data_fim:
        query = query.filter(RegistroHora.data <= data_fim)

    return query.all()
