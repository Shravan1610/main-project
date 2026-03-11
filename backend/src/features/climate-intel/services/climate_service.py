from src.shared.clients.http_client import get_http_client
from src.shared.config import get_settings


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
