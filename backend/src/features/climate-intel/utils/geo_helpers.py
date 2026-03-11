from math import asin, cos, radians, sin, sqrt


def validate_coordinates(lat: float, lng: float) -> bool:
    return -90 <= lat <= 90 and -180 <= lng <= 180


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * asin(sqrt(a))
    return radius_km * c


def get_region(lat: float, lng: float) -> str:
    if lat >= 0 and lng >= 0:
        return "Northeast"
    if lat >= 0 and lng < 0:
        return "Northwest"
    if lat < 0 and lng >= 0:
        return "Southeast"
    return "Southwest"
