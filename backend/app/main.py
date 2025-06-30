from fastapi import FastAPI
from app.routes.user import router as user_router
from app.routes.auth import router as auth_router  # novo
from app.routes.perfil import router as perfil
from app.routes.projeto import router as projeto
from app.routes.registro_hora import router as registro_hora
from fastapi.middleware.cors import CORSMiddleware
from app.routes import relatorio

app = FastAPI()

origins = [
    "http://localhost:3010",
    "http://127.0.0.1:3010"
]

app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(auth_router, tags=["Auth"])  # novo
app.include_router(perfil, prefix="/perfis", tags=["Perfis"])
app.include_router(projeto, prefix="/projetos", tags=["Projetos"])
app.include_router(registro_hora, prefix="/registros-hora", tags=["Registros de Horas"])
app.include_router(relatorio.router, prefix="/relatorio", tags=["Relatório"])


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ou especifique ["http://localhost:3010"]
    allow_credentials=True,
    allow_methods=["*"],  # <- Isso aqui é importante
    allow_headers=["*"],
)

# from fastapi import FastAPI, WebSocket
# from app.routes import auth, user

# app = FastAPI()

# app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# app.include_router(user.router, prefix="/users", tags=["Users"])

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     while True:
#         data = await websocket.receive_text()
#         await websocket.send_text(f"Recebido: {data}")
