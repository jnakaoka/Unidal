# schemas/registro_hora
from typing import List, Optional
from pydantic import BaseModel
from datetime import date


class MembroEquipa(BaseModel):
    user_id: int

    class Config:
        from_attributes = True


class RegistroHoraBase(BaseModel):
    projeto_id: int
    usuario_id: int
    data: date
    horas: Optional[int] = 0
    cliente: Optional[str] = None
    obra: Optional[str] = None
    metros_quadrados: Optional[str] = None
    preparacao: Optional[bool] = None
    bruto: Optional[bool] = None
    colagem: Optional[bool] = None
    acabamento: Optional[bool] = None
    serragem: Optional[bool] = None
    intervencao_maquinas: Optional[bool] = None
    equipa: List[MembroEquipa]


class RegistroHoraCreate(RegistroHoraBase):
    pass


class RegistroHoraUpdate(RegistroHoraBase):
    pass


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    empresa: str

    class Config:
        from_attributes = True

class ProjetoResponse(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True

class RegistroHoraEquipaResponse(BaseModel):
    user: UserResponse

    class Config:
        from_attributes = True

class RegistroHoraResponse(BaseModel):
    id: int
    usuario_id: int
    projeto_id: int
    data: date
    horas: Optional[int] = 0

    cliente: Optional[str] = None
    obra: Optional[str] = None
    metros_quadrados: Optional[str] = None

    preparacao: Optional[bool] = None
    bruto: Optional[bool] = None
    colagem: Optional[bool] = None
    acabamento: Optional[bool] = None
    serragem: Optional[bool] = None
    intervencao_maquinas: Optional[bool] = None

    user: UserResponse
    projeto: ProjetoResponse
    equipa: List[RegistroHoraEquipaResponse]

    class Config:
        from_attributes = True



# from __future__ import annotations

# from pydantic import BaseModel, EmailStr
# from typing import Optional, List, TYPE_CHECKING
# from datetime import date

# if TYPE_CHECKING:
#     from app.schemas.user import UserBase, UserOut

# class RegistroHoraBase(BaseModel):
#     usuario_id: int
#     projeto_id: int
#     data: date
#     horas: float

#     cliente: Optional[str] = None
#     obra: Optional[str] = None
#     metros_quadrados: Optional[str] = None

#     preparacao: bool = False
#     bruto: bool = False
#     colagem: bool = False
#     acabamento: bool = False
#     serragem: bool = False
#     intervencao_maquinas: bool = False

#     equipa: Optional[List[RegistroHoraEquipeItem]] = []

# class RegistroHoraCreate(RegistroHoraBase):
#     pass
#     # data: date
#     # horas: float
#     # usuario_id: int
#     # equipa: List[int] = []  # IDs dos usuários da equipa

# class RegistroHoraEquipeItem(BaseModel):
#     user_id: int
#     email: EmailStr  # ou apenas `str` se você não quiser validar formato de email

# class RegistroHoraUpdate(BaseModel):
#     id: int
#     usuario_id: int
#     projeto_id: int
#     data: Optional[date]
#     horas: Optional[float]

#     cliente: Optional[str]
#     obra: Optional[str]
#     metros_quadrados: Optional[str]

#     preparacao: Optional[bool]
#     bruto: Optional[bool]
#     colagem: Optional[bool]
#     acabamento: Optional[bool]
#     serragem: Optional[bool]
#     intervencao_maquinas: Optional[bool]

#     #user: Optional["UserBase"]
#     equipa: Optional[List[RegistroHoraEquipeItem]] = []
#     # usuario_id: Optional[int] = None
#     # projeto_id: Optional[int] = None
#     # data: Optional[date] = None
#     # horas: Optional[float] = None
#     # equipa: List[int] = []

# # class RegistroHoraOut(BaseModel):
# #     id: int
# #     usuario_id: int
# #     projeto_id: int
# #     data: Optional[date]
# #     horas: Optional[float]

# #     cliente: Optional[str]
# #     obra: Optional[str]
# #     metros_quadrados: Optional[str]

# #     preparacao: Optional[bool]
# #     bruto: Optional[bool]
# #     colagem: Optional[bool]
# #     acabamento: Optional[bool]
# #     serragem: Optional[bool]
# #     intervencao_maquinas: Optional[bool]

# #     #user: Optional["UserBase"]
# #     equipa: List["UserBase"]

# class RegistroHoraOut(BaseModel):
#     id: int
#     horas: float
#     cliente: Optional[str] = None
#     obra: Optional[str] = None
#     metros_quadrados: Optional[str] = None  # corrigido para str, como no modelo

#     preparacao: Optional[bool] = None
#     bruto: Optional[bool] = None
#     colagem: Optional[bool] = None
#     acabamento: Optional[bool] = None
#     serragem: Optional[bool] = None
#     intervencao_maquinas: Optional[bool] = None

#     equipa: Optional[List["UserOut"]] = []
#     usuario_nome: Optional[str] = None

#     model_config = {
#         "from_attributes": True
#     }

# class RegistroHoraRead(RegistroHoraBase):
#     id: int
#     equipa: List["UserOut"]

#     model_config = {
#         "from_attributes": True
#     }

# # 🔁 Importações em tempo de execução
# from app.schemas.user import UserBase, UserOut

# # 🔁 Reconstrução dos modelos com forward references
# RegistroHoraOut.model_rebuild()
# RegistroHoraRead.model_rebuild()
