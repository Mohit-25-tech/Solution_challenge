import math
from typing import Tuple


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371  # Earth radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def get_distance_score(distance_km: float, max_distance: float = 25) -> float:
    """
    Convert distance to score (0-1).
    Score = max(0, 1 - distance / max_distance)
    """
    score = max(0, 1 - (distance_km / max_distance))
    return score


def format_distance(distance_km: float) -> str:
    """
    Format distance for display.
    Returns '< 0.1 km' when below 0.1, otherwise 'X.X km'.
    """
    if distance_km < 0.1:
        return "< 0.1 km"
    return f"{distance_km:.1f} km"
