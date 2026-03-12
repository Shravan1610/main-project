from __future__ import annotations

import asyncio
import math
import random

from src.shared.clients.cache_client import get_cached, set_cached
from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings

# Grid of lat/lng points covering the globe (~54 points)
_LATITUDES = [-50, -30, -10, 10, 30, 50]
_LONGITUDES = [-160, -120, -80, -40, 0, 40, 80, 120, 160]

_HEATMAP_CACHE_KEY = "climate:global-heatmap"
_HEATMAP_CACHE_TTL = 1800  # 30 minutes


def _vulnerability_from_weather(temp_c: float, wind_mps: float) -> tuple[str, float]:
    score = 30.0
    if temp_c >= 35 or temp_c <= 0:
        score += 25
    if wind_mps >= 10:
        score += 20

    if score >= 80:
        return "critical", score
    if score >= 60:
        return "high", score
    if score >= 40:
        return "moderate", score
    return "low", score


async def get_climate_data(lat: float, lng: float) -> dict:
    settings = get_settings()

    if not settings.climate_api_key:
        return {
            "coordinates": (lat, lng),
            "summary": "No live climate provider key configured",
            "vulnerability": "moderate",
            "vulnerability_score": 50.0,
            "events": [],
            "temperature_trend": None,
            "risk_factors": [],
        }

    try:
        client = get_http_client()
        response = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lng, "appid": settings.climate_api_key, "units": "metric"},
        )
        response.raise_for_status()
        payload = response.json() if response.content else {}
    except Exception:
        return {
            "coordinates": (lat, lng),
            "summary": "Climate API unavailable",
            "vulnerability": "moderate",
            "vulnerability_score": 50.0,
            "events": [],
            "temperature_trend": None,
            "risk_factors": [],
        }

    main = payload.get("main", {})
    wind = payload.get("wind", {})
    weather_items = payload.get("weather", [])

    temp_c = float(main.get("temp", 20.0) or 20.0)
    wind_mps = float(wind.get("speed", 0.0) or 0.0)
    vulnerability, score = _vulnerability_from_weather(temp_c, wind_mps)

    summary = weather_items[0].get("description") if weather_items else "No weather description"
    summary_text = f"Current weather: {summary}. Temp {temp_c:.1f}C, wind {wind_mps:.1f} m/s."

    return {
        "coordinates": (lat, lng),
        "summary": summary_text,
        "vulnerability": vulnerability,
        "vulnerability_score": score,
        "events": [],
        "temperature_trend": None,
        "risk_factors": [],
    }


def _latitude_based_temperature(lat: float, lng: float) -> float:
    """Deterministic fallback: equator ~30°C, poles ~-10°C, with lng variation."""
    base = 30 - abs(lat) * 0.65
    # Add some longitudinal variation for realism
    variation = 5 * math.sin(math.radians(lng * 2))
    # Small deterministic "noise" per point
    noise = 3 * math.sin(lat * 0.7 + lng * 0.3)
    return round(base + variation + noise, 1)


async def _fetch_point_temperature(lat: float, lng: float, api_key: str) -> dict:
    """Fetch temperature for one grid point from OpenWeatherMap."""
    try:
        client = get_http_client()
        resp = await client.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lng, "appid": api_key, "units": "metric"},
        )
        resp.raise_for_status()
        data = resp.json() if resp.content else {}
        main = data.get("main", {})
        wind = data.get("wind", {})
        temp = float(main.get("temp", 20.0) or 20.0)
        humidity = float(main.get("humidity", 50.0) or 50.0)
        wind_speed = float(wind.get("speed", 0.0) or 0.0)
    except Exception:
        temp = _latitude_based_temperature(lat, lng)
        humidity = 50.0
        wind_speed = 0.0

    # Normalize temperature to a 0-1 weight (range: -30°C to 50°C)
    weight = max(0.05, min(1.0, (temp + 30) / 80))

    return {
        "lat": round(lat, 2),
        "lng": round(lng, 2),
        "temperature": round(temp, 1),
        "humidity": round(humidity, 1),
        "wind_speed": round(wind_speed, 1),
        "weight": round(weight, 3),
    }


async def get_global_climate_heatmap() -> list[dict]:
    """Return a grid of climate data points covering the whole planet."""
    cached = get_cached(_HEATMAP_CACHE_KEY)
    if cached is not None:
        return cached

    settings = get_settings()
    grid: list[dict] = []

    if settings.climate_api_key:
        # Fetch real data with concurrency limit (respect 60 req/min free tier)
        sem = asyncio.Semaphore(15)

        async def fetch_limited(lat: float, lng: float) -> dict:
            async with sem:
                return await _fetch_point_temperature(lat, lng, settings.climate_api_key)

        tasks = [fetch_limited(lat, lng) for lat in _LATITUDES for lng in _LONGITUDES]
        grid = await asyncio.gather(*tasks)
        grid = list(grid)
    else:
        # No API key — use latitude-based temperature model
        for lat in _LATITUDES:
            for lng in _LONGITUDES:
                temp = _latitude_based_temperature(lat, lng)
                weight = max(0.05, min(1.0, (temp + 30) / 80))
                grid.append({
                    "lat": round(lat, 2),
                    "lng": round(lng, 2),
                    "temperature": round(temp, 1),
                    "humidity": 50.0,
                    "wind_speed": 0.0,
                    "weight": round(weight, 3),
                })

    set_cached(_HEATMAP_CACHE_KEY, grid)
    return grid
