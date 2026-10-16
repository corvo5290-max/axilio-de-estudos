# StudyMind — Tutor IA

Versão inicial do Tutor IA integrada ao layout existente do StudyMind.

## 1. Preparar o backend no Linux Mint

Abra o terminal dentro da pasta `backend`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
nano .env
```

Coloque sua chave Groq depois de `GROQ_API_KEY=` no arquivo `.env`. Não compartilhe nem envie esse arquivo ao GitHub.

## 2. Iniciar o backend

Ainda na pasta `backend`, com o ambiente virtual ativado:

```bash
uvicorn main:app --reload --port 8000
```

Teste `http://127.0.0.1:8000/health`; deve responder com status online.

## 3. Abrir o frontend localmente

Em outro terminal, volte à raiz do projeto (a pasta que contém `index.html`) e execute:

```bash
python3 -m http.server 5500
```

Abra `http://127.0.0.1:5500` e entre em Tutor IA. O JavaScript chama `http://127.0.0.1:8000` enquanto você testa localmente.

## 4. Publicar

O GitHub Pages hospeda somente o frontend. O backend Python precisa ser hospedado separadamente. Antes de usar em público, configure `CORS_ORIGINS` com a origem exata do GitHub Pages e implemente limites de uso/autenticação para evitar abuso da API. Configure `GROQ_API_KEY` nas variáveis de ambiente do serviço de backend, nunca no frontend ou no repositório.

## Segurança

- Não commitar `backend/.env`.
- Não colocar a chave no `app.js` ou no HTML.
- CORS não é autenticação e não impede chamadas feitas fora do navegador.
