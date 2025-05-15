from fastapi import FastAPI
from app.routes.user import router as user_router

app = FastAPI()

app.include_router(user_router, prefix="/users", tags=["Users"])

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
