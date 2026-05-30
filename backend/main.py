from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from datetime import datetime
import uuid
import json
import urllib.request
from pydantic import BaseModel

# ==========================================
# 1. DATABASE SETUP
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./instaremit_ledger.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TransactionRecord(Base):
    __tablename__ = "transactions"
    
    transaction_id = Column(String, primary_key=True, index=True)
    recipient_name = Column(String, nullable=False)
    gross_amount_inr = Column(Column(Float, nullable=False))
    fee_deducted_inr = Column(Float, nullable=False)
    net_amount_usd = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)
    status = Column(String, default="Processing")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. DATA VALIDATION
# ==========================================
class TransactionCreate(BaseModel):
    recipient_name: str
    gross_amount_inr: float

# ==========================================
# 3. API ROUTES
# ==========================================
app = FastAPI(title="InstaRemit Data Pipeline API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "system_status": "Active",
        "message": "InstaRemit API Engine is running smoothly.",
        "database": "SQLite Connected"
    }

# Dynamic Live Rate Helper
def fetch_live_rate_inr() -> float:
    try:
        url = "https://open.er-api.com/v6/latest/USD"
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
            # Fetching the USD to INR rate dynamically
            return float(data["rates"]["INR"])
    except Exception:
        # Fallback rate if external market API is temporarily timing out
        return 83.50

# Optimized Ingestion Pipeline
@app.post("/transactions/")
def create_transaction(txn: TransactionCreate, db: Session = Depends(get_db)):
    
    # 1. Fetch live market data dynamically
    exchange_rate = fetch_live_rate_inr()
    fee_percentage = 0.03
    
    # 2. Run core financial calculation engine
    fee_amount = round(txn.gross_amount_inr * fee_percentage, 2)
    converted_inr = txn.gross_amount_inr - fee_amount
    net_usd = round(converted_inr / exchange_rate, 2)
    
    # 3. Generate a unique Transaction UUID
    unique_tx_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

    # 4. Format the clean data for the SQL ledger
    new_record = TransactionRecord(
        transaction_id=unique_tx_id,
        recipient_name=txn.recipient_name,
        gross_amount_inr=txn.gross_amount_inr,
        fee_deducted_inr=fee_amount,
        net_amount_usd=net_usd,
        exchange_rate=exchange_rate,
        status="Processing"
    )

    # 5. Commit directly to the database layer
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record

@app.get("/transactions/all")
def get_all_transactions(db: Session = Depends(get_db)):
    return db.query(TransactionRecord).all()