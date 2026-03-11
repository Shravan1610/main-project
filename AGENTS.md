# Repository Guidelines

## Project Structure & Module Organization
This is a monorepo with two apps and shared API contracts.
- `frontend/`: Next.js 14 + TypeScript app (`app/`, `features/`, `shared/`).
- `backend/`: FastAPI service (`src/api`, `src/features`, `src/shared`).
- `contracts/`: JSON Schema response contracts used by both apps.
- `docs/`: architecture, API notes, demo script, and team checklists.

Keep feature code inside its feature folder (for example, `frontend/features/comparison/` or `backend/src/features/news-intel/`) and expose frontend modules through local `index.ts` barrels.

## Build, Test, and Development Commands
Frontend (`frontend/`):
- `npm install`: install dependencies.
- `npm run dev`: run local app at `http://localhost:3000`.
- `npm run build`: production build.
- `npm run lint`: run Next.js ESLint checks.
- `npm run type-check`: TypeScript check with no emit.

Backend (`backend/`):
- `pip install -r requirements.txt`: install Python deps.
- `uvicorn src.main:app --reload --port 8000`: run API locally.
- `pytest tests/`: run backend tests.

## Coding Style & Naming Conventions
Frontend:
- TypeScript + React hooks, functional components.
- File names use kebab-case (example: `search-result-item.tsx`); component names use PascalCase.
- Prefer Tailwind utilities and shared helpers in `frontend/shared/`.

Backend:
- Python with type hints and Pydantic schemas.
- File/function names use snake_case (example: `resolver_service.py`).
- Keep route/controller/service responsibilities separated.

## Testing Guidelines
- Backend uses `pytest` and `pytest-asyncio`.
- Place tests under `backend/tests/` as `test_*.py`.
- Current endpoint test files are mostly stubs; when adding features, implement real assertions and contract validation against `contracts/*.json`.

## Commit & Pull Request Guidelines
- Prefer Conventional Commit style (`feat:`, `fix:`, `chore:`); current history already includes `feat:` usage.
- Keep commits scoped to one concern and avoid unrelated cross-folder changes.
- PRs should include:
  - What changed and why.
  - Linked issue/task.
  - Contract impact (`contracts/` changed or not).
  - Screenshots for UI changes and sample request/response for API changes.

## Security & Configuration Tips
- Copy env templates before running locally: root `.env.example`, plus frontend/backend env files.
- Never commit real API keys or secrets.
- Keep `NEXT_PUBLIC_API_URL` and backend CORS settings aligned for local development.

## Remote Collaboration Constraints (Mandatory)
- This repo is being edited by 4 people in parallel; keep changes tightly scoped to the assigned task.
- Do not read `.env` files.
- Use only `plan.md` and files under `docs/` as project context unless explicitly asked otherwise.
- Do not assume missing requirements; ask clear questions when requirements are unclear.
- Keep implementations simple and direct; avoid over-engineering.

## ESG Service Endpoints
- Base URL: `https://greenverify-api.onrender.com/`
- Health: `https://greenverify-api.onrender.com/`
- Swagger docs: `https://greenverify-api.onrender.com/docs`
- Predict endpoint: `https://greenverify-api.onrender.com/predict`
