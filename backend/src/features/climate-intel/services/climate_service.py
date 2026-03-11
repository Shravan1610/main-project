def get_climate_data(lat: float, lng: float) -> dict:
    return {
        "coordinates": (lat, lng),
        "vulnerability": "moderate",
        "vulnerability_score": 50.0,
        "events": [],
        "temperature_trend": None,
        "risk_factors": [],
    }
