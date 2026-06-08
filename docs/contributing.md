# Contributing

## Local setup

1. Create and activate a virtual environment.
2. Install dependencies with `pip install -e .`.
3. Run the app with `fastapi dev main.py` or `uvicorn main:app --reload`.
4. Open `http://127.0.0.1:8000`.

## Team conventions

- Keep route handlers small.
- Put business logic in `services`.
- Put JSON storage logic in `repositories`.
- Do not store plain text passwords.
- Keep pull requests focused on one feature or fix.
- Update `README.md` when setup or behavior changes.
