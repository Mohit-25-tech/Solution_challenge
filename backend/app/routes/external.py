from fastapi import APIRouter
from app.services.external_feeds import get_ndma_alerts, get_weather_severity

router = APIRouter(prefix="/external", tags=["external"])


@router.get("/ndma-alerts")
async def ndma_alerts():
    """
    Fetch NDMA disaster alerts.
    Returns static fallback data if real API unavailable — always returns something for the demo map.
    """
    alerts = await get_ndma_alerts()
    return {"alerts": alerts, "count": len(alerts)}


@router.get("/weather")
async def weather(lat: float, lng: float):
    """
    Fetch weather severity for coordinates.
    Returns safe defaults if API key not configured.
    Query: /external/weather?lat=23.02&lng=72.57
    """
    result = await get_weather_severity(lat, lng)
    return result
