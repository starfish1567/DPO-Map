#!/usr/bin/env python3
"""Fetch live DPO vehicles and save them for the static map app."""

from pathlib import Path

from scripts.fetch_dpo_data import fetch_and_save


if __name__ == "__main__":
    output_path = Path("data/vehicles.json")
    fetch_and_save(output_path)
