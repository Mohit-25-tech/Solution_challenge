import httpx
import json
import os
from app.core.config import settings

# Ensure cache directory exists on module load
os.makedirs(settings.CACHE_DIR, exist_ok=True)

# Static fallback data — always shown when both network AND cache are unavailable
# This ensures the demo map always has orange pins regardless of network state
NDMA_STATIC_FALLBACK = [
    {
        "title": "Flood Alert — Ahmedabad District",
        "lat": 23.022,
        "lng": 72.571,
        "type": "rescue",
        "urgency": 5,
        "source": "ndma_feed",
        "description": "Heavy rainfall warning issued. Rescue volunteers and boats needed urgently."
    },
    {
        "title": "Medical Camp — Mumbai North",
        "lat": 19.176,
        "lng": 72.937,
        "type": "medical",
        "urgency": 4,
        "source": "ndma_feed",
        "description": "Medical volunteers needed for flood relief camp. First aid experience required."
    },
    {
        "title": "Food Distribution — Delhi Relief Zone",
        "lat": 28.713,
        "lng": 77.309,
        "type": "food",
        "urgency": 3,
        "source": "ndma_feed",
        "description": "Food distribution drive for 2,000 displaced families. Logistics volunteers welcome."
    },
    {
        "title": "Search & Rescue — Chennai Coast",
        "lat": 13.182,
        "lng": 80.370,
        "type": "rescue",
        "urgency": 5,
        "source": "ndma_feed",
        "description": "Cyclone approaching. Search and rescue teams needed along coast."
    },
    {
        "title": "Construction Support — Hyderabad",
        "lat": 17.285,
        "lng": 78.387,
        "type": "construction",
        "urgency": 3,
        "source": "ndma_feed",
        "description": "Temporary shelter construction for displaced families. Labor and materials needed."
    },
]


async def fetch_with_fallback(url: str, cache_key: str) -> dict:
    """
    Fetch JSON from URL with file-based cache fallback.
    If network fails → try cache file.
    If cache fails → return empty dict (callers handle gracefully).
    Never throws — always returns something.
    """
    cache_path = os.path.join(settings.CACHE_DIR, f"{cache_key}.json")

    # Try live fetch first
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            # Verify it's actually JSON before caching (some APIs return HTML error pages)
            data = resp.json()
            try:
                with open(cache_path, "w") as f:
                    json.dump(data, f)
            except Exception:
                pass  # Cache write failure is non-fatal
            return data
    except Exception:
        pass

    # Try reading cached file
    try:
        if os.path.exists(cache_path):
            with open(cache_path) as f:
                return json.load(f)
    except Exception:
        pass

    # Both network and cache unavailable — return empty dict
    return {}


async def get_ndma_alerts() -> list:
    """
    Fetch NDMA disaster alerts.
    Falls back to static demo data if API unavailable (very common with govt APIs).
    """
    data = await fetch_with_fallback(settings.NDMA_FEED_URL, "ndma_alerts")

    # NDMA uses GeoJSON features array, or may return {alerts: [...]} or {items: [...]}
    items = data.get("features", data.get("alerts", data.get("items", [])))

    if not items:
        # Use static fallback so demo map always has orange pins
        return NDMA_STATIC_FALLBACK

    alerts = []
    for item in items[:10]:
        props = item.get("properties", item)
        try:
            alert = {
                "title": props.get("headline", props.get("title", "Disaster Alert")),
                "lat": float(props.get("latitude", 20.5937)),
                "lng": float(props.get("longitude", 78.9629)),
                "type": props.get("event", "rescue"),
                "urgency": 4,
                "source": "ndma_feed",
                "description": props.get("description", "")
            }
            alerts.append(alert)
        except Exception:
            continue

    # Always return something — fall back to static if parse yielded nothing
    return alerts if alerts else NDMA_STATIC_FALLBACK


async def get_weather_severity(lat: float, lng: float) -> dict:
    """
    Fetch current weather severity for coordinates.
    Returns {severity, description, temp_celsius}.
    Returns safe defaults if API key not configured or network unavailable.
    """
    if not settings.OPENWEATHER_API_KEY:
        return {
            "severity": "unknown",
            "description": "API key not configured",
            "temp_celsius": None
        }

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lng}&appid={settings.OPENWEATHER_API_KEY}&units=metric"
    )
    cache_key = f"weather_{round(lat, 2)}_{round(lng, 2)}"
    data = await fetch_with_fallback(url, cache_key)

    if not data or "weather" not in data:
        return {
            "severity": "unknown",
            "description": "unavailable",
            "temp_celsius": None
        }

    weather_id = data["weather"][0]["id"]
    temp = data.get("main", {}).get("temp")

    # WMO weather codes: <300 = thunderstorm, 300-599 = drizzle/rain, 600-699 = snow,
    #                    700-799 = atmosphere, 800 = clear, 800+ = clouds, 900+ = extreme
    if weather_id >= 900 or weather_id < 300:
        severity = "extreme"
    elif weather_id < 600:
        severity = "high"
    elif weather_id < 700:
        severity = "moderate"
    else:
        severity = "low"

    return {
        "severity": severity,
        "description": data["weather"][0]["description"],
        "temp_celsius": temp
    }
