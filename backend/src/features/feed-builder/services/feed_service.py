from datetime import datetime
import importlib.util
from pathlib import Path


def _load_local_function(file_name: str, fn_name: str):
    path = Path(__file__).resolve().with_name(file_name)
    spec = importlib.util.spec_from_file_location(f"feed_builder_{file_name.replace('.', '_')}", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load {file_name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    fn = getattr(module, fn_name, None)
    if fn is None:
        raise AttributeError(f"Missing function '{fn_name}' in {file_name}")
    return fn


fetch_news_feed = _load_local_function("news_feed.py", "fetch_news_feed")
fetch_stock_feed = _load_local_function("stock_feed.py", "fetch_stock_feed")
fetch_crypto_feed = _load_local_function("crypto_feed.py", "fetch_crypto_feed")


async def get_feeds() -> dict:
    return {
        "stocks": await fetch_stock_feed(limit=8),
        "news": await fetch_news_feed(limit=8),
        "crypto": await fetch_crypto_feed(limit=8),
        "updatedAt": datetime.utcnow().isoformat() + "Z",
    }
