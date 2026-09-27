from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

DATABASE_URL = (
    "postgresql+psycopg://"
    "payagent:payagent_password@localhost:5432/payagent_db"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

def get_db():
    db: Session = SessionLocal()

    try:
        yield db
    finally:
        db.close()