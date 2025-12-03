from passlib.hash import bcrypt

def hash_password(pwd: str) -> str:
    return bcrypt.hash(pwd)

def verify_password(pwd: str, hashed: str) -> bool:
    try:
        return bcrypt.verify(pwd, hashed)
    except Exception:
        return False
