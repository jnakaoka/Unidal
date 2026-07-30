from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

nova_senha = "Johann.Nakaoka.Hpr"
hash_senha = pwd_context.hash(nova_senha)

print("Senha:", nova_senha)
print("Hash:", hash_senha)