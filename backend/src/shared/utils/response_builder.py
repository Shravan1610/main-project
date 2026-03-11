from typing import Any


def success_response(data: Any, message: str = "OK") -> dict[str, Any]:
    return {
        "status": "success",
        "message": message,
        "data": data,
    }


def error_response(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
