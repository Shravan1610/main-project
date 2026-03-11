from enum import Enum

from pydantic import BaseModel


class EntityType(str, Enum):
    company = "company"
    stock = "stock"
    crypto = "crypto"


class EntityResult(BaseModel):
    id: str
    name: str
    type: EntityType
    ticker: str | None = None
    description: str | None = None
    coordinates: dict[str, float] | None = None
    logo_url: str | None = None
