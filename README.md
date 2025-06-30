# Unidal

escopo do projeto
a ideia desse projeto e criar uma plataforma que vai funcionar em dois pontos, 
sendo que um dele estara distribuido no nos dispositivos de funcionarios, possivelmente nos telefones portateis de cada um, o outro ponto sera o escritorio da empresa,
a solucao sera on-premises, ou seja as informacoes ficam armazenadas diretamente na empresa, entao as alteracoes feitas tanto no acesso pela empresa quanto no acesso dos dispositivos
deve ser atualizado no lado oposto em tempo real.

Pontos importantes:
deve existir niveis diferentes de usuarios
a aplicacao deve funcionar em computadores e dispositivos moveis
os dados ficam disponiveis e sao atualizados em tempo real
deve ser possivel o envio de notificacoes

Tecnologia
o desenvolvimento precisa ser simples, eu penso em usar python e banco de dados mysql, entretando gostaria que voce avaliace essa escolha e me diga se eh uma boa opcao,
considerando:
a necessidade de ser seguro, os usuarios comuns nao devem ter acesso a informacoes de outros usuarios comuns e terao outros usuarios com niveis de acesso diferentes
disponibilidade de acesso ao sistema


1. podemos seguir com sua sugestao, React com vite
2. gostaria de uma interface que sirva para web e seja responsivo para mobile
3. Funcionalidades para o MVP
Login/autenticacao
visualizacao/edicao/exclusao de projeto, usuarios, perfil
visualizacao/relatorio das horas trabalhadas por operador/mes/projeto
tela para o registro das horascom autenticacao para o operador ver soh seus projetos ou para o pefil admin poder ver tudo
Dashboard de produtividade
4. Bibliotecas ou componentes visuais preferidos? pode escolher a melhor opcao



{
  "name": "user1",
  "email": "user1@example.com",
  "password": "tst_123",
  "perfil_id": 1
}

{
  "nome": "operador",
  "is_active": true
}

para ativar o ambiente virtual
source venv/Scripts/activate


para rodar o projeto sem docker
$ uvicorn app.main:app --reload 


permissao do script
chmod +x start.sh

cria a estrutura do alembic
alembic init alembic

alembic version
alembic --version


para rodar os scripts do alambic dentro do docker foi necessario add o - ./alembic.ini:/app/alembic.ini no 

services:
  api:
    build: ./backend
    container_name: unidal_api
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=mysql+mysqlconnector://unidal:admin_135@db/unidal
    volumes:
      - ./backend:/app
      - ./alembic.ini:/app/alembic.ini

depois disso rodei o container "docker-compose up --build" en outro terminal bash

IMPORTANTE para executar isso precisa ter os containeres rodando logo precisa subir o container em segundo plano e lembrar q eh dentro do ambiente virtual
docker compose up -d

Lista os containeres rodando
docker ps

Entra dentro do container para rodar os comandos do alembic, sempre lembrar de ativar o ambiente virtual
winpty docker exec -it unidal_api bash



cria a migracao das alteracoes de bd
alembic revision --autogenerate -m "Descrição da mudança" --verbose

aplicar migracao
alembic upgrade head


derruba o container docker (atencao isso deleta as tabelas tbm, ja q o container do db eh derrubado)
docker-compose down -v --remove-orphans

derruba os dockers mas n apaga as tabelas
docker-compose down

para criar as tabelas
docker compose exec unidal_api python app/create_tables.py

aplica as migracoes do db
alembic upgrade head

rodar o docker
docker-compose up --build

rodar o docker em segundo plano
docker-compose up -d (util para rodar comandos dentro do docker)

para criar o bd
docker-compose exec api python create_tables.py

acesso ao db

verifica os dbs 
docker ps

acesso ao db
winpty docker exec -it unidal_db mysql -u root -p

selecao do db
USE unidal

query de select 
SELECT * FROM users WHERE perfil_id IS NOT NULL;

SELECT * FROM projeto;

SHOW TABLES;

verificar o sql sem executar
alembic upgrade head --sql

Alternativas se não tiver winpty:
Use o terminal do PowerShell ou Prompt de Comando (CMD) em vez do Git Bash.

Ou, no Git Bash, use o seguinte workaround (sem interatividade):

bash
Copiar
Editar
docker exec -i unidal_db mysql -u root -pMINSENHA -e "USE nome_do_banco; SELECT * FROM users WHERE perfil_id IS NULL;"

acesso local do db
http://localhost:8000/docs#/Users/get_users_users__get

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyM0BleGFtcGxlLmNvbSIsInBlcmZpbCI6ImFkbWluIiwiZXhwIjoxNzQ4MjU2MzU1fQ.ocqIWxGlhFl-O1-_lLQ3TwJTn5VTA2EliPyWG9KMQJM


exemplo de fetch de login no front
fetch("/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    username: email,
    password: senha
  }),
});

rotas protegidas
from fastapi import APIRouter, Depends
from app.utils.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "perfil": current_user.perfil
    }
	
	
	
 Bônus: Caso queira que um campo(perfil_id) seja opcional, ajuste assim:
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    perfil_id: Optional[int] = None