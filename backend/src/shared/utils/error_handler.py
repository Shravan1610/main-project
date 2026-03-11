from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.shared.utils.logger import get_logger
from src.shared.utils.response_builder import error_response

logger = get_logger(__name__)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(_, exc: HTTPException) -> JSONResponse:
        code = "HTTP_ERROR"
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            code = str(exc.detail["code"])
        message = exc.detail.get("message", str(exc.detail)) if isinstance(exc.detail, dict) else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content=error_response(code=code, message=message))

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_response(code="VALIDATION_ERROR", message="Request validation failed", details={"errors": exc.errors()}),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled server error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=error_response(code="INTERNAL_ERROR", message="Internal server error"),
        )
