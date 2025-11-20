def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': '{"message": "Sai Kalpataru Vidyalaya - Basic Handler Test", "status": "working"}'
    }

# Also export for ASGI
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Sai Kalpataru Vidyalaya - FastAPI Test", "status": "working"}

# Export both for testing
handler = handler  # Lambda-style handler
# app = app  # ASGI app (already defined)
