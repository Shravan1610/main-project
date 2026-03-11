from typing import Any

from src.shared.schemas.base_schema import BaseSchema


class ErrorDetail(BaseSchema):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseSchema):
    error: ErrorDetail
