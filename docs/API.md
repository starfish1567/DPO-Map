# API Notes

## Source endpoint

The data fetcher uses:

`POST https://dashboard.dpo.cz/api/server`

with this payload:

```json
{
  "apiMethod": "GET",
  "endpoint": "transport/vehicle/list?page=dashboard&withTripId=1&vehicleStates=ride",
  "data": {}
}
```

## Important hosting note

The API worked when called from Python with `Origin` and `Referer` headers, but the response did not advertise permissive browser CORS headers during testing on April 22, 2026.

Because of that, the frontend reads from the generated `data/vehicles.json` snapshot instead of calling the API straight from the browser.

## Normalized frontend shape

Each published vehicle contains the fields below:

- `id`
- `vehicleNumber`
- `route`
- `type`
- `headSign`
- `tripFrom`
- `tripTo`
- `finalStopName`
- `lastStopName`
- `delaySeconds`
- `delayLabel`
- `delayState`
- `engineType`
- `isBarrierLess`
- `airCondition`
- `securityCamera`
- `lat`
- `lng`
- `modelName`
- `image`
- `licensePlate`
- `commissioning`
- `seating`
- `standing`
- `jointCount`
- `carriage`
- `totalKm`

## If the upstream API changes

Update `scripts/fetch_dpo_data.py` in one place, regenerate `data/vehicles.json`, and the frontend should keep working as long as the normalized shape stays stable.
