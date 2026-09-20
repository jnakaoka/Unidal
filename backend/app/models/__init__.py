# tables to create on db
#classes
from .perfil import Perfil
from .user import User
from .projeto import Projeto
from .cliente import Cliente
from .obra import Obra
from .veiculo import Veiculo
from .maquina import Maquina
from .cartao import Cartao
from .registro_hora import RegistroHora
#tables
from .registro_hora import RegistroHoraEquipa
from app.models.cartao_veiculo_associacao import (
    CartaoVeiculoAssociacao,
)
from app.models.veiculo_condutor_associacao import (
    VeiculoCondutorAssociacao,
)

