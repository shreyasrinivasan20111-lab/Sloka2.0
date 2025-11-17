from fastapi import FastAPI
from fastapi.responses import JSONResponse
import os

# Simple app without database for testing
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Sai Kalpataru Vidyalaya - System Online", "status": "healthy"}

@app.get("/health")
async def health():
    return {"status": "healthy", "environment": "vercel"}

@app.get("/test")
async def test():
    return {
        "message": "Test endpoint working",
        "python_version": os.sys.version,
        "cwd": os.getcwd(),
        "env_vars": list(os.environ.keys())[:10]  # First 10 env vars
    }

# Vercel handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
