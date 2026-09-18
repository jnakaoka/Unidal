import os
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()


class Settings:
    PROJECT_NAME: str = "Unidal"
    PROJECT_VERSION: str = "1.0"

    DB_USER: str = os.getenv("DB_USER", "unidal")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "unidal_db")
    DB_PORT: str = os.getenv("DB_PORT", "3306")
    DB_NAME: str = os.getenv("DB_NAME", "unidal")

    @property
    def DATABASE_URL(self) -> str:
        password = quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+mysqlconnector://{self.DB_USER}:{password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def DATABASE_URL_SAFE(self) -> str:
        return (
            f"mysql+mysqlconnector://{self.DB_USER}:***"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "sua-chave-super-secreta")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30


settings = Settings()
