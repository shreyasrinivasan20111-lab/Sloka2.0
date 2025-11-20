from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Sai Kalpataru Vidyalaya"}

@app.get("/test")  
def test():
    return {"status": "working", "service": "minimal_test"}

# This is the key export for Vercel
handler = app
