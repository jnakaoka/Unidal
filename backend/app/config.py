import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Unidal"
    PROJECT_VERSION: str = "1.0"

    DB_USER: str = os.getenv("DB_USER", "unidal")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "admin_135")
    DB_HOST: str = os.getenv("DB_HOST", "unidal_db")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "unidal")

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+mysqlconnector://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "sua-chave-super-secreta")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30

settings = Settings()
print("URL de conexão com banco de dados:", settings.DATABASE_URL)
