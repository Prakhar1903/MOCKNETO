from api import router


@router.get("/ping")
def ping():
    return {"message": "pong"}
