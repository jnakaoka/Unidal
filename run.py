from app.database import Base, engine
from app.models import User, perfil

print("🔧 Criando tabelas no banco de dados...")
Base.metadata.create_all(bind=engine)
print("✅ Tabelas criadas com sucesso.")
