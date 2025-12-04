import os

class Config:
    # Valores por defecto para tu entorno local
    DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
    DB_NAME = os.getenv("DB_NAME", "bd_truquefinal")
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "root")

    # 1) Intentar leer DATABASE_URL (la que pusiste en Railway)
    _db_url = os.getenv("DATABASE_URL", "")

    if _db_url:
        # Railway suele dar "mysql://", lo convertimos a "mysql+pymysql://"
        if _db_url.startswith("mysql://"):
            _db_url = _db_url.replace("mysql://", "mysql+pymysql://", 1)

        SQLALCHEMY_DATABASE_URI = _db_url
    else:
        # 2) Si NO hay DATABASE_URL (por ejemplo en tu PC), usar tu config local de siempre
        SQLALCHEMY_DATABASE_URI = (
            f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:3306/{DB_NAME}?charset=utf8mb4"
        )

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret")
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:4200")


