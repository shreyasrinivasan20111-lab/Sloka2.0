from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
def index():
    return {"message": "Sai Kalpataru Vidyalaya - API Route", "status": "working"}

@app.get("/health")
def health():
    return {"status": "healthy", "service": "sai_kalpataru"}

# Export for Vercel
handler = app
