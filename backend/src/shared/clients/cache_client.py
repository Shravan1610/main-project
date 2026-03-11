from collections.abc import Callable
from functools import wraps
from threading import Lock
from typing import Any

from cachetools import TTLCache

from src.shared.config import get_settings

settings = get_settings()
cache = TTLCache(maxsize=256, ttl=settings.cache_ttl_seconds)
cache_lock = Lock()


def get_cached(key: str) -> Any | None:
    with cache_lock:
        return cache.get(key)


def set_cached(key: str, value: Any) -> None:
    with cache_lock:
        cache[key] = value


def cached(key_builder: Callable[..., str]) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            key = key_builder(*args, **kwargs)
            cached_value = get_cached(key)
            if cached_value is not None:
                return cached_value

            value = await func(*args, **kwargs)
            set_cached(key, value)
            return value

        return async_wrapper

    return decorator
