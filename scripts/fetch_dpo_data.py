#!/usr/bin/env python3
"""Utilities for fetching and normalizing DPO vehicle data."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

API_URL = "https://dashboard.dpo.cz/api/server"
API_PAYLOAD = {
    "apiMethod": "GET",
    "endpoint": "transport/vehicle/list?page=dashboard&withTripId=1&vehicleStates=ride",
    "data": {},
}
API_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Origin": "https://dashboard.dpo.cz",
    "Referer": "https://dashboard.dpo.cz/",
}


def normalize_vehicle_type(raw_type: str | None) -> str:
    if raw_type == "troll":
        return "trolleybus"
    return raw_type or "unknown"


def delay_label(delay_seconds: int | None) -> str:
    if delay_seconds is None:
        return "Unknown"
    if delay_seconds <= 30:
        return "On time"
    minutes = round(delay_seconds / 60)
    return f"{minutes} min delay"


def normalize_vehicle(item: dict[str, Any]) -> dict[str, Any]:
    data = item.get("data", {})
    transport = item.get("transportData", {})
    model = item.get("model", {})
    position = item.get("config", {}).get("map", {}).get("position", {})

    delay_seconds = data.get("delay")
    return {
        "id": item.get("devID"),
        "vehicleNumber": data.get("vehicleNumber"),
        "route": data.get("routeID"),
        "type": normalize_vehicle_type(data.get("vehicleType")),
        "agencyName": data.get("agencyName"),
        "headSign": data.get("headSign"),
        "tripFrom": data.get("tripFrom"),
        "tripTo": data.get("tripTo"),
        "finalStopName": data.get("finalStopName"),
        "lastStopName": data.get("lastStopName"),
        "state": data.get("vehicleState"),
        "delaySeconds": delay_seconds,
        "delayLabel": delay_label(delay_seconds),
        "delayState": data.get("delayState"),
        "engineType": data.get("engineType"),
        "isBarrierLess": data.get("isBarrierLess"),
        "airCondition": data.get("airCondition"),
        "securityCamera": data.get("securityCamera"),
        "apc": data.get("apc"),
        "lat": position.get("lat"),
        "lng": position.get("lng"),
        "modelName": model.get("name") or transport.get("model"),
        "image": model.get("image"),
        "licensePlate": transport.get("licensePlate"),
        "commissioning": transport.get("commissioning"),
        "seating": transport.get("seating"),
        "standing": transport.get("standing"),
        "jointCount": transport.get("jointCount"),
        "carriage": transport.get("carriage"),
        "totalKm": data.get("totalKm"),
    }


def fetch_live_data(timeout: int = 30) -> dict[str, Any]:
    response = requests.post(
        API_URL,
        json=API_PAYLOAD,
        headers=API_HEADERS,
        timeout=timeout,
    )
    response.raise_for_status()
    payload = response.json()

    vehicles = [
        normalize_vehicle(item)
        for item in payload.get("data", [])
        if item.get("config", {}).get("map", {}).get("position")
    ]

    type_counts: dict[str, int] = {}
    for vehicle in vehicles:
        vehicle_type = vehicle.get("type") or "unknown"
        type_counts[vehicle_type] = type_counts.get(vehicle_type, 0) + 1

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": API_URL,
        "count": len(vehicles),
        "typeCounts": type_counts,
        "vehicles": vehicles,
    }


def fetch_and_save(output_path: Path) -> dict[str, Any]:
    payload = fetch_live_data()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch DPO vehicle data.")
    parser.add_argument(
        "--output",
        default="data/vehicles.json",
        help="Path to the output JSON file.",
    )
    args = parser.parse_args()

    payload = fetch_and_save(Path(args.output))
    print(f"Saved {payload['count']} vehicles to {args.output}")


if __name__ == "__main__":
    main()
