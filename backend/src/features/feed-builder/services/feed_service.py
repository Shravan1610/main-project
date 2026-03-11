from datetime import datetime


def get_feeds() -> dict:
    return {"stocks": [], "news": [], "crypto": [], "updated_at": datetime.utcnow().isoformat()}
