# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session, joinedload
# from datetime import date
# from app.database import get_db
# from app.dependencies.auth import get_current_user
# from app.models.roster import Roster, RosterMember
# from app.schemas.roster import RosterUpsertIn, RosterOut, RosterCopyFromLastIn
# from app.models.user import User

# router = APIRouter(prefix="/rosters", tags=["Rosters"])

# @router.get("/", response_model=RosterOut)
# def get_roster(cliente_id: int, obra_id: int, data: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     roster = (
#         db.query(Roster)
#         .options(joinedload(Roster.members).joinedload(RosterMember.user))
#         .filter(Roster.cliente_id == cliente_id, Roster.obra_id == obra_id, Roster.data == data)
#         .first()
#     )
#     if not roster:
#         raise HTTPException(status_code=404, detail="Roster não encontrado")
#     return roster

# @router.post("/", response_model=RosterOut)
# def upsert_roster(payload: RosterUpsertIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     roster = (
#         db.query(Roster)
#         .filter(Roster.cliente_id == payload.cliente_id, Roster.obra_id == payload.obra_id, Roster.data == payload.data)
#         .first()
#     )
#     if not roster:
#         roster = Roster(
#             cliente_id=payload.cliente_id,
#             obra_id=payload.obra_id,
#             data=payload.data,
#             leader_user_id=current_user.id,
#             status="DRAFT",
#         )
#         db.add(roster)
#         db.flush()
#     else:
#         roster.leader_user_id = current_user.id

#     # replace members
#     db.query(RosterMember).filter(RosterMember.roster_id == roster.id).delete()
#     for uid in payload.member_ids:
#         db.add(RosterMember(roster_id=roster.id, user_id=uid))

#     db.commit()
#     db.refresh(roster)
#     return roster

# @router.post("/copy-from-last", response_model=RosterOut)
# def copy_from_last(payload: RosterCopyFromLastIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     last = (
#         db.query(Roster)
#         .options(joinedload(Roster.members))
#         .filter(Roster.cliente_id == payload.cliente_id, Roster.obra_id == payload.obra_id, Roster.data < payload.data)
#         .order_by(Roster.data.desc())
#         .first()
#     )
#     if not last:
#         raise HTTPException(status_code=404, detail="Nenhuma escala anterior encontrada")

#     # create new
#     new_roster = Roster(
#         cliente_id=payload.cliente_id,
#         obra_id=payload.obra_id,
#         data=payload.data,
#         leader_user_id=current_user.id,
#         source_roster_id=last.id,
#         status="DRAFT",
#     )
#     db.add(new_roster)
#     db.flush()

#     for m in last.members:
#         db.add(RosterMember(roster_id=new_roster.id, user_id=m.user_id))

#     db.commit()
#     db.refresh(new_roster)
#     return new_roster
