
import os
import logging
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from groq import Groq, APIError

# Carrega variáveis locais, se houver um arquivo .env.
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("studymind")

app = FastAPI(
    title="StudyMind Tutor API",
    version="0.2.0",
)

# Domínios autorizados a acessar a API pelo navegador.
# No Render, CORS_ORIGINS, se definida, substitui esta lista padrão.
default_origins = (
    "https://corvo5290-max.github.io,"
    "http://localhost:5500,"
    "http://127.0.0.1:5500,"
    "http://localhost:8000,"
    "http://127.0.0.1:8000"
)

origins_env = os.getenv("CORS_ORIGINS", default_origins)
origins = [
    origin.strip().rstrip("/")
    for origin in origins_env.split(",")
    if origin.strip()
]

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


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "StudyMind Tutor API",
    }


@app.get("/health")
def health():
    return {
        "status": "online",
        "service": "StudyMind Tutor API",
    }


@app.post("/api/tutor")
def tutor(request: TutorRequest):
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="A chave da API ainda não foi configurada no backend.",
        )

    messages = [
        {
            "role": "system",
            "content": (
                "Você é o Tutor StudyMind, um tutor educacional que conversa "
                "em português brasileiro. Explique de forma clara, paciente "
                "e em etapas, usando exemplos adequados ao nível escolar. "
                "Ajude o estudante a raciocinar e faça perguntas de "
                "acompanhamento quando útil. Não humilhe o estudante. "
                "Explique exercícios em vez de apenas entregar respostas. "
                "Se não souber algo, diga isso e não afirme que suas respostas "
                "são infalíveis."
            ),
        }
    ]

    messages.extend(
        {"role": message.role, "content": message.content}
        for message in request.messages
    )

    try:
        client = Groq(
            api_key=api_key,
            timeout=30.0,
            max_retries=1,
        )

        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
            messages=messages,
            temperature=0.6,
            max_completion_tokens=1200,
        )

        answer = completion.choices[0].message.content

        return {
            "resposta": answer
            or "Não consegui formular uma resposta. Tente perguntar de outro jeito."
        }

    except APIError as exc:
        logger.warning(
            "Erro retornado pela API da Groq: %s",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "A API de IA não conseguiu responder agora. "
                "Tente novamente mais tarde."
            ),
        ) from None

    except Exception as exc:
        logger.error(
            "Falha ao consultar tutor: %s",
            type(exc).__name__,
        )
        raise HTTPException(
            status_code=502,
            detail="O tutor encontrou um erro inesperado. Tente novamente.",
        ) from None
