
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from routers.notify import router as notify_router


logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("email-client")


app = FastAPI(debug=True)

# Allow CORS from everywhere
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Incoming {request.method} {request.url}")
    try:
        response = await call_next(request)
        logger.debug(f"Completed {request.method} {request.url} -> {response.status_code}")
        return response
    except Exception:
        logger.exception("Unhandled error during request processing")
        raise


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})
app.include_router(notify_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")
