# Contributing

Thanks for helping improve DPO Live Map.

## Development flow

1. Create a branch.
2. Run `pip install -r requirements.txt`.
3. Refresh local data with `python3 DPOAPI.py` if needed.
4. Start a local server with `python3 -m http.server 8000`.
5. Make your changes and open a pull request.

## Contribution guidelines

- Keep the app GitHub Pages-compatible.
- Avoid adding a heavyweight frontend build step unless there is a strong reason.
- Do not commit secrets, cookies, or private tokens.
- Prefer small, reviewable pull requests.
- Update docs when behavior changes.

## Areas that are especially useful

- UI polish and accessibility
- Filtering and search improvements
- Mobile experience
- More resilient API normalization
- Tests for the Python fetch layer

## Reporting issues

When reporting a bug, include:

- what you expected
- what happened instead
- browser and device
- a screenshot if the issue is visual
- a sample payload if the issue is data-related
