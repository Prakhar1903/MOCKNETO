from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")

from api import routes  # noqa: E402, F401
