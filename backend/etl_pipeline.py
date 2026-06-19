import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# 1. SETUP: Load the secret Aiven database URL
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix the URL for SQLAlchemy if needed (Render/Aiven sometimes use 'postgres://' instead of 'postgresql://')
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def run_etl():
    print("🚀 Starting ETL Pipeline...")

    # ==========================================
    # Phase 1: EXTRACT
    # ==========================================
    print("📥 Extracting data from Aiven Database...")
    engine = create_engine(DATABASE_URL)
    
    # Read the entire transactions table directly into a Pandas DataFrame
    query = "SELECT * FROM transactions"
    try:
        df = pd.read_sql(query, engine)
        print(f"✅ Successfully extracted {len(df)} transactions.")
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        return

    # ==========================================
    # Phase 2: TRANSFORM
    # ==========================================
    print("⚙️ Transforming and cleaning data...")
    
    # 1. Convert 'created_at' into a proper Date object
    if 'created_at' in df.columns:
        df['date'] = pd.to_datetime(df['created_at']).dt.date
    else:
        from datetime import date
        df['date'] = date.today()

    # 2. Group by the Date and sum up BOTH the INR and USD columns
    summary_df = df.groupby(['date'])[['gross_amount_inr', 'net_amount_usd']].sum().reset_index()
    
    # 3. Rename the columns to make the final CSV look professional
    summary_df.rename(columns={
        'gross_amount_inr': 'total_volume_inr',
        'net_amount_usd': 'total_volume_usd'
    }, inplace=True)
    
    print("✅ Transformation complete.")
    
    # ==========================================
    # Phase 3: LOAD
    # ==========================================
    print("📤 Loading data into Analytics Warehouse...")
    
    # Save the cleaned summary to a CSV file (This acts as our Data Warehouse)
    output_file = "daily_remittance_summary.csv"
    summary_df.to_csv(output_file, index=False)
    
    print(f"🎉 ETL Complete! Summary saved to: {output_file}")
    print("\n--- Here is a preview of your Analytics Data ---")
    print(summary_df.head())

if __name__ == "__main__":
    run_etl()