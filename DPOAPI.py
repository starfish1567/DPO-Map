import requests
import json

url = "https://dashboard.dpo.cz/api/server"

payload = {
    "apiMethod": "GET",
    "endpoint": "transport/vehicle/list?page=dashboard&withTripId=1&vehicleStates=ride",
    "data": {}
}

headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "Content-Type": "application/json",

    # tvoje cookies (OK)
    "Cookie": "NEXT_LOCALE=cs; _ga_R6V1Z7L5PD=GS2.1.s1776861165$o1$g1$t1776862779$j31$l0$h0; _ga=GA1.1.1604270709.1776861166",

    # 🔥 TOTO JE KLÍČ
    "Origin": "https://dashboard.dpo.cz",
    "Referer": "https://dashboard.dpo.cz/",

    # simulace fetch
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty"
}

response = requests.post(url, json=payload, headers=headers)

print("Status:", response.status_code)
print(response.text[:1000])  # jen část
