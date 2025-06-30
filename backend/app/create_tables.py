from app.database import Base, engine
import app.models  # isso importa todos os modelos registrados no __init__.py de models

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created!")
