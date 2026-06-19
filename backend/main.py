# # from fastapi.middleware.cors import CORSMiddleware
# # from fastapi import FastAPI, Depends, HTTPException
# # from sqlalchemy import create_engine, Column, String, Float, DateTime
# # from sqlalchemy.orm import declarative_base, sessionmaker, Session
# # from datetime import datetime
# # import uuid
# # import json
# # import os
# # import urllib.request
# # from pydantic import BaseModel
# # from typing import AsyncGenerator
# # from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
# # from sqlalchemy.orm import DeclarativeBase

# # # ==========================================
# # # 1. DATABASE SETUP
# # # ==========================================
# # # Swapped to cloud-native PostgreSQL and adjusted the protocol dialect for SQLAlchemy compatibility
# # SQLALCHEMY_DATABASE_URL = "postgresql://avnadmin:AVNS_Mny5eVX5RCYlyHLtIPE@pg-112faf3f-tufts-6cbe.l.aivencloud.com:17592/defaultdb?sslmode=require"
# # DATABASE_URL = "mysql+aiomysql://root:Revanth@123@localhost:3306/revanth"

# # engine = create_async_engine(
# #     DATABASE_URL,
# #     echo=True,              # Set to False in production (logs all SQL queries)
# #     pool_pre_ping=True,     # Checks connection health before running queries
# #     pool_recycle=3600       # Prevents MySQL idle timeout errors
# # )

# # # 3. Create a session factory
# # AsyncSessionLocal = async_sessionmaker(
# #     bind=engine,
# #     expire_on_commit=False  # Important for async workflows
# # )

# # # 4. Base class for defining database models
# # class Base(DeclarativeBase):
# #     pass

# # # 5. Dependency injection helper for FastAPI routes
# # async def get_db() -> AsyncGenerator[AsyncSession, None]:
# #     async with AsyncSessionLocal() as session:
# #         yield session

# # # engine = create_engine(SQLALCHEMY_DATABASE_URL)
# # # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# # # Base = declarative_base()

# # class TransactionRecord(Base):
# #     __tablename__ = "transactions"
    
# #     transaction_id = Column(String, primary_key=True, index=True)
# #     recipient_name = Column(String, nullable=False)
# #     gross_amount_inr = Column(Float, nullable=False)
# #     fee_deducted_inr = Column(Float, nullable=False)
# #     net_amount_usd = Column(Float, nullable=False)
# #     exchange_rate = Column(Float, nullable=False)
# #     status = Column(String, default="Processing")
# #     created_at = Column(DateTime, default=datetime.utcnow)

# # # Automatically spins up tables in your Aiven cluster on startup
# # Base.metadata.create_all(bind=engine)

# # def get_db():
# #     db = SessionLocal()
# #     try:
# #         yield db
# #     finally:
# #         db.close()

# # # ==========================================
# # # 2. DATA VALIDATION
# # # ==========================================
# # class TransactionCreate(BaseModel):
# #     recipient_name: str
# #     gross_amount_inr: float

# # # ==========================================
# # # 3. API ROUTES
# # # ==========================================
# # app = FastAPI(title="InstaRemit Data Pipeline API")

# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=["*"], 
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # @app.get("/")
# # def health_check():
# #     return {
# #         "system_status": "Active",
# #         "message": "InstaRemit API Engine is running smoothly.",
# #         "database": "Aiven PostgreSQL Connected"
# #     }

# # # Dynamic Live Rate Helper
# # def fetch_live_rate_inr() -> float:
# #     try:
# #         url = "https://open.er-api.com/v6/latest/USD"
# #         with urllib.request.urlopen(url, timeout=5) as response:
# #             data = json.loads(response.read().decode())
# #             return float(data["rates"]["INR"])
# #     except Exception:
# #         return 83.50

# # # Optimized Ingestion Pipeline (POST / Create Data)
# # @app.post("/transactions/")
# # def create_transaction(txn: TransactionCreate, db: Session = Depends(get_db)):
    
# #     # 1. Fetch live market data dynamically
# #     exchange_rate = fetch_live_rate_inr()
# #     fee_percentage = 0.03
    
# #     # 2. Run core financial calculation engine
# #     fee_amount = round(txn.gross_amount_inr * fee_percentage, 2)
# #     converted_inr = txn.gross_amount_inr - fee_amount
# #     net_usd = round(converted_inr / exchange_rate, 2)
    
# #     # 3. Generate a unique Transaction UUID
# #     unique_tx_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

# #     # 4. Format the clean data for the SQL ledger
# #     new_record = TransactionRecord(
# #         transaction_id=unique_tx_id,
# #         recipient_name=txn.recipient_name,
# #         gross_amount_inr=txn.gross_amount_inr,
# #         fee_deducted_inr=fee_amount,
# #         net_amount_usd=net_usd,
# #         exchange_rate=exchange_rate,
# #         status="Processing"
# #     )

# #     # 5. Commit directly to the cloud database layer
# #     db.add(new_record)
# #     db.commit()
# #     db.refresh(new_record)

# #     return new_record

# # # Dynamic Read Pipeline (GET / Read Data)
# # @app.get("/transactions/")
# # def read_transactions(db: Session = Depends(get_db)):
# #     # Grab all transactions from Aiven, sorting by date so the newest are at the top
# #     transactions = db.query(TransactionRecord).order_by(TransactionRecord.created_at.desc()).all()
# #     return transactions



# import datetime
# import json
# import urllib.request
# import uuid
# from typing import Generator
# from fastapi import FastAPI, Depends, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from sqlalchemy import create_engine, Column, String, Float, DateTime, func, desc
# from sqlalchemy.orm import declarative_base, sessionmaker, Session

# # ==========================================
# # 1. DATABASE CONFIGURATION (MySQL Version)
# # ==========================================
# # Format: mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
# DATABASE_URL = "mysql+pymysql://root:Revanth%40123@127.0.0.1:3306/revanth"

# engine = create_engine(
#     DATABASE_URL,
#     pool_recycle=3600,  # Prevents MySQL idle timeout errors
#     pool_pre_ping=True  # Automatically healthchecks the connection
# )

# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()


# # ==========================================
# # 2. DATABASE MODELS
# # ==========================================
# class TransactionRecord(Base):
#     __tablename__ = "transactions"
    
#     transaction_id = Column(String(50), primary_key=True, index=True)
#     recipient_name = Column(String(255), nullable=False)
    
#     # Map the Python properties to the actual MySQL column names
#     gross_amount_inr = Column("gross_amount", Float, nullable=False)
#     fee_deducted_inr = Column("fee_deducted", Float, nullable=False)
#     net_amount_usd = Column("net_amount", Float, nullable=False)
    
#     exchange_rate = Column(Float, nullable=False)
#     status = Column(String(50), default="Processing")
#     created_at = Column(DateTime, server_default=func.now(), index=True)


# # Automatically spins up tables in your MySQL database on startup
# Base.metadata.create_all(bind=engine)


# # Dependency injection helper for FastAPI routes
# def get_db() -> Generator[Session, None, None]:
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # ==========================================
# # 3. DATA VALIDATION
# # ==========================================
# class TransactionCreate(BaseModel):
#     recipient_name: str
#     gross_amount_inr: float


# # ==========================================
# # 4. API ROUTES
# # ==========================================
# app = FastAPI(title="InstaRemit Data Pipeline API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# @app.get("/")
# def health_check():
#     return {
#         "system_status": "Active",
#         "message": "InstaRemit API Engine is running smoothly.",
#         "database": "MySQL Connected"
#     }


# # Dynamic Live Rate Helper
# def fetch_live_rate_inr() -> float:
#     try:
#         url = "https://open.er-api.com/v6/latest/USD"
#         with urllib.request.urlopen(url, timeout=5) as response:
#             data = json.loads(response.read().decode())
#             return float(data["rates"]["INR"])
#     except Exception:
#         return 83.50


# # Optimized Ingestion Pipeline (POST / Create Data)
# @app.post("/transactions/")
# def create_transaction(txn: TransactionCreate, db: Session = Depends(get_db)):
#     try:
#         # 1. Fetch live market data dynamically
#         exchange_rate = fetch_live_rate_inr()
#         fee_percentage = 0.03
        
#         # 2. Run core financial calculation engine
#         fee_amount = round(txn.gross_amount_inr * fee_percentage, 2)
#         converted_inr = txn.gross_amount_inr - fee_amount
#         net_usd = round(converted_inr / exchange_rate, 2)
        
#         # 3. Generate a unique Transaction UUID
#         unique_tx_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

#         # 4. Format the clean data for the SQL ledger
#         new_record = TransactionRecord(
#             transaction_id=unique_tx_id,
#             recipient_name=txn.recipient_name,
#             gross_amount_inr=txn.gross_amount_inr,
#             fee_deducted_inr=fee_amount,
#             net_amount_usd=net_usd,
#             exchange_rate=exchange_rate,
#             status="Processing"
#         )

#         # 5. Commit directly to the cloud database layer
#         db.add(new_record)
#         db.commit()
#         db.refresh(new_record)

#         return new_record
        
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Database write failed: {str(e)}")


# # Dynamic Read Pipeline (GET / Read Data)
# @app.get("/transactions/")
# def read_transactions(db: Session = Depends(get_db)):
#     # Grab all transactions from MySQL, sorting by date so the newest are at the top
#     transactions = db.query(TransactionRecord).order_by(desc(TransactionRecord.created_at)).all()
#     return transactions


import uuid
import datetime
import urllib.request
import json
from typing import Generator
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import create_engine, Column, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext

# Import all schemas (Make sure TransactionCreate is in your schemas.py file!)
from schemas import UserCreate, UserLogin, TransactionCreate

# ==========================================
# 1. DATABASE CONNECTION
# ==========================================

import os
from dotenv import load_dotenv

# ==========================================
# 1. DATABASE CONNECTION
# ==========================================
load_dotenv() # This reads your secret .env file!
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, pool_recycle=3600, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. DATABASE MODELS
# ==========================================
class User(Base):
    __tablename__ = "users"
    user_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone_number = Column(String(20), unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.now)

class UserVerification(Base):
    __tablename__ = "user_verifications"
    verification_id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(50), default="NONE")
    document_status = Column(String(50), default="UNVERIFIED")
    otp_code = Column(String(10))
    is_phone_verified = Column(Boolean, default=False)

class TransactionRecord(Base):
    __tablename__ = "transactions"
    transaction_id = Column(String(50), primary_key=True, index=True)
    sender_id = Column(String(50), ForeignKey("users.user_id"), nullable=False)
    recipient_name = Column(String(255), nullable=False)
    gross_amount = Column(Float, nullable=False)
    fee_deducted = Column(Float, nullable=False)
    net_amount = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)
    status = Column(String(50), default="Processing")
    created_at = Column(DateTime, default=datetime.datetime.now, index=True)

Base.metadata.create_all(bind=engine)

# ==========================================
# 3. FASTAPI SETUP & UTILITIES
# ==========================================

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="InstaRemit Backend API")

# Add this block to allow React to talk to FastAPI!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fetch_live_rate_inr() -> float:
    try:
        url = "https://open.er-api.com/v6/latest/USD"
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
            return float(data["rates"]["INR"])
    except Exception:
        return 83.50

# ==========================================
# 4. API ROUTES
# ==========================================
@app.get("/")
def health_check():
    return {"status": "success", "message": "Backend connected to MySQL!"}

# --- REGISTER ---
@app.post("/users/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    new_user_id = f"USR-{uuid.uuid4().hex[:8].upper()}"

    new_user = User(
        user_id=new_user_id,
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        phone_number=user.phone_number
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user_id": new_user.user_id}

# --- LOGIN ---
@app.post("/users/login")
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not pwd_context.verify(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return {"message": "Login successful", "user_id": user.user_id, "full_name": user.full_name}

# --- CREATE TRANSACTION ---
@app.post("/transactions/create", status_code=status.HTTP_201_CREATED)
def create_transaction(txn: TransactionCreate, sender_id: str, db: Session = Depends(get_db)):
    sender = db.query(User).filter(User.user_id == sender_id).first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found.")

    exchange_rate = fetch_live_rate_inr()
    fee_percentage = 0.03
    
    fee_amount = round(txn.gross_amount * fee_percentage, 2)
    converted_amount = txn.gross_amount - fee_amount
    net_usd = round(converted_amount / exchange_rate, 2)
    
    unique_tx_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

    new_record = TransactionRecord(
        transaction_id=unique_tx_id,
        sender_id=sender_id,
        recipient_name=txn.recipient_name,
        gross_amount=txn.gross_amount,
        fee_deducted=fee_amount,
        net_amount=net_usd,
        exchange_rate=exchange_rate,
        status="Processing"
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {"message": "Transaction created successfully", "transaction": new_record}

# --- GET TRANSACTION HISTORY ---
@app.get("/transactions/")
def get_transactions(sender_id: str, db: Session = Depends(get_db)):
    # 1. Find all transactions linked to this specific user
    # 2. Sort them by 'created_at.desc()' so the newest ones show up at the top!
    transactions = db.query(TransactionRecord)\
                     .filter(TransactionRecord.sender_id == sender_id)\
                     .order_by(TransactionRecord.created_at.desc())\
                     .all()
    
    return transactions