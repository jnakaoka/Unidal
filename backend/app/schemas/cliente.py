# schemas/cliente.py
from pydantic import BaseModel, ConfigDict
from typing import Optional

class ClienteBase(BaseModel):
    nome: str
    is_active: bool = True

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    is_active: Optional[bool] = None

class ClienteOut(ClienteBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# from pydantic import BaseModel
# from typing import Optional

# class ClienteBase(BaseModel):
#     nome: str
#     is_active: bool = True

# class ClienteCreate(ClienteBase):
#     pass

# class ClienteUpdate(BaseModel):
#     nome: Optional[str] = None
#     is_active: Optional[bool] = None

# class ClienteOut(BaseModel):
#     id: int
#     nome: str
#     is_active: bool

#     class Config:
#         from_attributes = True