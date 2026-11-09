import sys
import json
import os
from openpyxl import Workbook, load_workbook

DATA_DIR = os.environ.get("FINANCES_DATA_DIR", os.path.dirname(os.path.abspath(__file__)))
os.makedirs(DATA_DIR, exist_ok=True)

FILE_NAME = os.path.join(DATA_DIR, "net_worth_data.xlsx")

# ============================================
# PART 1: NOTES START
# ============================================

NOTES_FILE = os.path.join(DATA_DIR, "notes.txt")

def read_notes():
    """Read notes from text file"""
    try:
        if os.path.exists(NOTES_FILE):
            with open(NOTES_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
            return {"status": "success", "content": content}
        else:
            return {"status": "success", "content": ""}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def save_notes(content):
    """Save notes to text file"""
    try:
        with open(NOTES_FILE, 'w', encoding='utf-8') as f:
            f.write(content)
        return {"status": "success", "message": "Notes saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ============================================
# PART 1: NOTES END
# ============================================


def save_to_excel(data):
    total_assets = (
        data['cash_current'] + 
        data['cash_current_2'] +
        data['cash_current_3'] +
        data['cash_savings'] +
        data['cash_ibkr'] + 
        data['cash_hand'] +
        (data['gold_weight'] * data['gold_price']) + 
        (data['sp500_shares'] * data['sp500_price']) +
        (data['global_shares'] * data['global_price']) + 
        (data['bond_shares'] * data['bond_price']) + 
        data['receivables']
    )
    net_worth = total_assets - data['credit_card']

    # Get the comment from data, default to empty string if missing
    comment = data.get('comment', "")

    if not os.path.exists(FILE_NAME):
        wb = Workbook()
        ws = wb.active
        ws.title = "Snapshots"
        ws.append([
            "Date", "Cash Savings", "Interest Rate", "Cash Current", "Cash Current 2", "Cash Current 3", "Cash IBKR", "Cash Hand", "Gold Weight", "Gold Price",
            "S&P Shares", "S&P Price", "Global Share", "Global Price", "Bond Share", "Bond Price",
            "Receivables", "Debt", "TOTAL NET WORTH", "Comment"
        ])
    else:
        wb = load_workbook(FILE_NAME)
        ws = wb.active

    # --- IMPROVEMENT: Check if Date already exists (for Editing) ---
    # If the date exists, delete that row before appending the new version
    for row in range(2, ws.max_row + 1):
        if str(ws.cell(row=row, column=1).value) == str(data['date']):
            ws.delete_rows(row)
            break

    ws.append([
        data['date'], data['cash_savings'], data['savings_rate'], data['cash_current'], data['cash_current_2'], data['cash_current_3'], data['cash_ibkr'], data['cash_hand'], 
        data['gold_weight'], data['gold_price'], data['sp500_shares'],
        data['sp500_price'], data['global_shares'], data['global_price'], data['bond_shares'], data['bond_price'], data['receivables'], data['credit_card'], 
        net_worth, comment
    ])
    wb.save(FILE_NAME)
    return net_worth

def delete_snapshot(date_to_delete):
    """Finds the row with the matching date and removes it"""
    if not os.path.exists(FILE_NAME):
        return False
    
    wb = load_workbook(FILE_NAME)
    ws = wb.active
    
    deleted = False
    # Iterate backwards so deleting rows doesn't mess up the loop index
    for row in range(ws.max_row, 1, -1):
        if str(ws.cell(row=row, column=1).value) == str(date_to_delete):
            ws.delete_rows(row)
            deleted = True
            
    wb.save(FILE_NAME)
    return deleted

def get_history():
    """New function to read the Excel file and return data to React"""
    if not os.path.exists(FILE_NAME):
        return []
    
    wb = load_workbook(FILE_NAME)
    ws = wb.active
    data = []
    
    # row[0] is Date, row[1] is Cash Savings... row[9] is Total Net Worth
    for row in ws.iter_rows(min_row=2, values_only=True):
        if not row[0]: continue # Skip empty rows
        data.append({
            "date": str(row[0]),
            "cash_savings": row[1],
            "savings_rate":row[2],
            "cash_current": row[3],
            "cash_current_2": row[4],
            "cash_current_3": row[5],
            "cash_ibkr": row[6],
            "cash_hand": row[7],
            "gold_weight": row[8],
            "gold_price": row[9],
            "sp500_shares": row[10],
            "sp500_price": row[11],
            "global_shares": row[12],
            "global_price": row[13],
            "bond_shares": row[14],
            "bond_price": row[15],
            "receivables": row[16],
            "credit_card": row[17],
            "net_worth": row[18],
            "comment": row[19]
        })
    return data

if __name__ == "__main__":
    try:
        
        
        # Check command line arguments
        if len(sys.argv) > 1:
            command = sys.argv[1]
            
            if command == "read":
                history = get_history()
                print(json.dumps({"status": "success", "data": history}))
            
            elif command == "delete":
                date_to_remove = sys.argv[2]
                success = delete_snapshot(date_to_remove)
                print(json.dumps({"status": "success" if success else "not_found"}))

            # NEW: Notes start
            elif command == "read_notes":
                result = read_notes()
                print(json.dumps(result))
            
            elif command == "save_notes":
                content = sys.argv[2] if len(sys.argv) > 2 else ""
                result = save_notes(content)
                print(json.dumps(result))
            # NEW: Notes end

        else:
            # Default: Add/Update snapshot
            input_raw = sys.stdin.read()
            if not input_raw:
                raise ValueError("No input data received via stdin")
                
            input_data = json.loads(input_raw)
            final_nw = save_to_excel(input_data)
            print(json.dumps({"status": "success", "net_worth": final_nw}))
            
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))