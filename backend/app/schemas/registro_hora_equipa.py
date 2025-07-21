# # app/schemas/registro_hora_equipa.py

from pydantic import BaseModel

class RegistroHoraEquipaCreate(BaseModel):
    user_id: int
    registro_id: int

class RegistroHoraEquipaOut(BaseModel):
    user_id: int
    registro_id: int

    class Config:
        orm_mode = True


# from pydantic import BaseModel
# from typing import TYPE_CHECKING
# from typing import Optional

# if TYPE_CHECKING:
#     from app.schemas.user import UserBase  # só para type hints estáticos

# class RegistroHoraEquipaOut(BaseModel):
#     id: int
#     usuario_id: int
#     user: Optional["UserBase"]

#     # user: "UserBase"  # referência futura
#     # horas: float

#     model_config = {
#         "from_attributes": True
#     }

# class RegistroHoraEquipaCreate(BaseModel):
#     user_id: int
#     horas: float


# # ✅ Importa UserBase em tempo de execução
# from app.schemas.user import UserBase

# # ✅ Reconstrói o modelo agora com referência resolvida
# RegistroHoraEquipaOut.model_rebuild()
