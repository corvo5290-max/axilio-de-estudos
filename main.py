import os
import logging
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from groq import Groq, APIError

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studymind")

app = FastAPI(title="StudyMind Tutor API", version="0.1.0")

# CORS limita quais sites podem chamar a API via navegador; isso não substitui
# autenticação, limites de uso ou proteção contra abuso em produção.
origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000",
)
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)

class TutorRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=12)

@app.get("/health")
def health():
    return {"status": "online", "service": "StudyMind Tutor API"}

@app.post("/api/tutor")
def tutor(request: TutorRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="A chave da API ainda não foi configurada no backend.")

    # Só aceita mensagens de usuário/assistente; o prompt de sistema fica no servidor.
    messages = [
        {
            "role": "system",
            "content": (
                "Você é o Tutor StudyMind, um tutor educacional que conversa em português brasileiro. "
                "Explique de forma clara e paciente, em etapas, usando exemplos adequados ao nível escolar. "
                "Ajude o estudante a raciocinar, faça perguntas de acompanhamento quando útil e não humilhe "
                "nem apenas entregue respostas de exercícios sem explicar. Se não souber algo, diga isso. "
                "Use formatação simples e evite afirmar que suas respostas são infalíveis."
            ),
        }
    ]
    messages.extend({"role": m.role, "content": m.content} for m in request.messages)

    try:
        client = Groq(api_key=api_key, timeout=30.0, max_retries=1)
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            messages=messages,
            temperature=0.6,
            max_completion_tokens=1200,
        )
        answer = completion.choices[0].message.content
        return {"resposta": answer or "Não consegui formular uma resposta. Tente perguntar de outro jeito."}
    except APIError as exc:
        logger.warning("Erro retornado pela API da Groq: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="A API de IA não conseguiu responder agora. Tente novamente mais tarde.") from None
    except Exception as exc:
        logger.error("Falha ao consultar tutor: %s", type(exc).__name__)
        raise HTTPException(status_code=502, detail="O tutor encontrou um erro inesperado. Tente novamente.") from None
