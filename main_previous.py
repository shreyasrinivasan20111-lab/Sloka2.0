from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os

# Ultra-minimal app for debugging
app = FastAPI(title="Sai Kalpataru Vidyalaya", version="1.0.0")

@app.get("/")
async def root():
    return {
        "message": "Sai Kalpataru Vidyalaya - Student Course Management System",
        "status": "online",
        "version": "1.0.0",
        "environment": "vercel_serverless"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "sai_kalpataru_vidyalaya",
        "timestamp": "2024-11-19"
    }

@app.get("/api/test")
async def test_api():
    try:
        return {
            "api_status": "working",
            "python_version": os.sys.version.split()[0],
            "working_directory": os.getcwd(),
            "environment_type": "serverless"
        }
    except Exception as e:
        return JSONResponse(
            content={"error": str(e), "status": "failed"},
            status_code=500
        )

# Vercel handler - this is critical for Vercel deployment
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
