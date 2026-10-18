from typing import Literal
from pydantic import BaseModel, Field, model_validator


class CategoriaInput(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    visibilidade: Literal["todos", "perfis", "usuarios", "admin"] = "admin"
    perfil_ids: list[int] = Field(default_factory=list)
    usuario_ids: list[int] = Field(default_factory=list)

    @model_validator(mode="after")
    def validar(self):
        self.nome = self.nome.strip()
        if not self.nome:
            raise ValueError("Informe o nome da categoria.")
        if self.visibilidade == "perfis" and not self.perfil_ids:
            raise ValueError("Selecione pelo menos um perfil.")
        if self.visibilidade == "usuarios" and not self.usuario_ids:
            raise ValueError("Selecione pelo menos um funcionário.")
        self.perfil_ids = sorted(set(self.perfil_ids)) if self.visibilidade == "perfis" else []
        self.usuario_ids = sorted(set(self.usuario_ids)) if self.visibilidade == "usuarios" else []
        return self
