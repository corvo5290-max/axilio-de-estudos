
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // CONFIGURAÇÃO
    // =====================================================

    const API_BASE_URL = "https://axilio-de-estudos.onrender.com";
    const STORAGE_KEY = "studymind_tutor_history_v1";
    const OLD_STORAGE_KEY = "studymind_tutor_conversation_v1";
    const MAX_CHATS = 50;
    const MAX_MESSAGES = 60;

    // =====================================================
    // ELEMENTOS DA INTERFACE
    // =====================================================

    const dateElement = document.getElementById("current-date");
    const menuToggle = document.getElementById("menu-toggle");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const navLinks = [...document.querySelectorAll(".nav-link")];
    const pages = [...document.querySelectorAll(".page")];
    const breadcrumbTitle = document.querySelector(".breadcrumb strong");

    const newChatButton = document.getElementById("new-chat-button");
    const historyList = document.getElementById("chat-history-list");

    const tutorForm = document.getElementById("tutor-form");
    const tutorInput = document.getElementById("tutor-input");
    const tutorSend = document.getElementById("tutor-send");
    const chatMessages = document.getElementById("chat-messages");
    const tutorStatus = document.getElementById("tutor-status-message");

    // =====================================================
    // UTILITÁRIOS
    // =====================================================

    function makeId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function validMessages(messages) {
        if (!Array.isArray(messages)) return [];

        return messages
            .filter((message) =>
                message &&
                ["user", "assistant"].includes(message.role) &&
                typeof message.content === "string" &&
                message.content.trim().length > 0
            )
            .map((message) => ({
                role: message.role,
                content: message.content.trim()
            }))
            .slice(-MAX_MESSAGES);
    }

    function makeTitle(messages) {
        const firstQuestion = messages.find(
            (message) => message.role === "user"
        );

        if (!firstQuestion) return "Nova conversa";

        const title = firstQuestion.content
            .replace(/\s+/g, " ")
            .trim();

        return title.length > 32
            ? `${title.slice(0, 32)}…`
            : title;
    }

    function setStatus(message, isError = false) {
        if (!tutorStatus) return;

        tutorStatus.textContent = message;
        tutorStatus.classList.toggle("error", isError);
    }

    // =====================================================
    // VOZ: SÍNTESE E RECONHECIMENTO
    // =====================================================

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const canSpeak = "speechSynthesis" in window &&
        typeof window.SpeechSynthesisUtterance !== "undefined";

    let recognition = null;
    let isListening = false;
    let recognitionStarting = false;
    let shouldSubmitVoice = false;
    let voiceBaseText = "";
    let finalTranscript = "";
    let currentUtterance = null;
    let sending = false;

    // Os controles são criados por JavaScript.
    const voiceControls = document.createElement("div");
    voiceControls.className = "tutor-voice-controls";

    const voiceButton = document.createElement("button");
    voiceButton.type = "button";
    voiceButton.id = "tutor-voice-button";
    voiceButton.className = "tutor-voice-button";
    voiceButton.textContent = "🎙️ Falar";
    voiceButton.setAttribute("aria-pressed", "false");

    const stopVoiceButton = document.createElement("button");
    stopVoiceButton.type = "button";
    stopVoiceButton.id = "tutor-stop-voice-button";
    stopVoiceButton.className = "tutor-stop-voice-button";
    stopVoiceButton.textContent = "🔇 Parar áudio";

    const voiceHint = document.createElement("span");
    voiceHint.className = "tutor-voice-status";
    voiceHint.setAttribute("role", "status");
    voiceHint.setAttribute("aria-live", "polite");

    voiceControls.append(
        voiceButton,
        stopVoiceButton,
        voiceHint
    );

    if (tutorForm && tutorForm.parentElement) {
        tutorForm.insertAdjacentElement("afterend", voiceControls);
    } else {
        voiceButton.disabled = true;
        stopVoiceButton.disabled = true;
    }

    function updateVoiceButton() {
        voiceButton.textContent = isListening
            ? "⏹️ Parar de ouvir"
            : "🎙️ Falar";

        voiceButton.setAttribute(
            "aria-pressed",
            String(isListening)
        );

        voiceButton.disabled =
            !recognition || sending || recognitionStarting;

        stopVoiceButton.disabled = !canSpeak && !currentUtterance;
    }

    function stopSpeaking() {
        if (canSpeak) {
            window.speechSynthesis.cancel();
        }

        currentUtterance = null;

        if (!isListening && !sending) {
            voiceHint.textContent = "Áudio interrompido.";
        }

        updateVoiceButton();
    }

    function speakAnswer(text) {
        if (!canSpeak || !text) {
            voiceHint.textContent =
                "A leitura em voz alta não está disponível neste navegador.";
            return;
        }

        window.speechSynthesis.cancel();
        currentUtterance = null;

        const utterance = new SpeechSynthesisUtterance(text);
        currentUtterance = utterance;

        utterance.lang = "pt-BR";
        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onstart = () => {
            if (currentUtterance === utterance) {
                voiceHint.textContent =
                    "Lendo a resposta em voz alta…";
            }
        };

        utterance.onend = () => {
            if (currentUtterance === utterance) {
                currentUtterance = null;
                voiceHint.textContent = "Leitura concluída.";
                updateVoiceButton();
            }
        };

        utterance.onerror = (event) => {
            if (currentUtterance !== utterance) return;

            currentUtterance = null;

            if (
                event.error !== "canceled" &&
                event.error !== "interrupted"
            ) {
                voiceHint.textContent =
                    "Não foi possível reproduzir a voz.";
            }

            updateVoiceButton();
        };

        window.speechSynthesis.speak(utterance);
        updateVoiceButton();
    }

    function resetVoiceTranscript() {
        finalTranscript = "";
        voiceBaseText = "";
        shouldSubmitVoice = false;
    }

    // =====================================================
    // RECONHECIMENTO DE FALA
    // =====================================================

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();

        recognition.lang = "pt-BR";
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.addEventListener("start", () => {
            recognitionStarting = false;
            isListening = true;

            updateVoiceButton();
            voiceHint.textContent = "Ouvindo… fale agora.";
        });

        recognition.addEventListener("result", (event) => {
            let interimTranscript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const result = event.results[i];
                const transcript = result[0]?.transcript || "";

                if (result.isFinal) {
                    // Guarda somente resultados finais novos.
                    finalTranscript += `${transcript} `;
                } else {
                    interimTranscript += `${transcript} `;
                }
            }

            const recognizedText = [
                finalTranscript.trim(),
                interimTranscript.trim()
            ].filter(Boolean).join(" ").trim();

            if (tutorInput) {
                tutorInput.value = [
                    voiceBaseText,
                    recognizedText
                ].filter(Boolean).join(" ").trim();
            }

            if (finalTranscript.trim()) {
                shouldSubmitVoice = true;
            }
        });

        recognition.addEventListener("error", (event) => {
            recognitionStarting = false;

            const messages = {
                "not-allowed":
                    "Permita o acesso ao microfone nas configurações do navegador.",
                "service-not-allowed":
                    "O navegador bloqueou o serviço de reconhecimento de fala.",
                "no-speech":
                    "Não detectei fala. Tente novamente.",
                "audio-capture":
                    "Não encontrei um microfone disponível.",
                "network":
                    "O reconhecimento de fala apresentou um erro de rede.",
                "aborted":
                    "A gravação foi interrompida."
            };

            voiceHint.textContent =
                messages[event.error] ||
                `Erro no reconhecimento de fala: ${event.error}.`;

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed" ||
                event.error === "audio-capture"
            ) {
                shouldSubmitVoice = false;
            }

            updateVoiceButton();
        });

        recognition.addEventListener("end", () => {
            isListening = false;
            recognitionStarting = false;

            updateVoiceButton();

            const transcript = finalTranscript.trim();
            const shouldSend =
                shouldSubmitVoice && Boolean(transcript);

            shouldSubmitVoice = false;

            if (shouldSend && tutorInput && tutorForm) {
                tutorInput.value = [
                    voiceBaseText,
                    transcript
                ].filter(Boolean).join(" ").trim();

                if (tutorInput.value.trim()) {
                    voiceHint.textContent =
                        "Enviando sua pergunta…";

                    tutorForm.requestSubmit();
                }
            } else if (
                voiceHint.textContent === "Ouvindo… fale agora." ||
                voiceHint.textContent === "Finalizando a gravação…"
            ) {
                voiceHint.textContent = transcript
                    ? "Gravação encerrada."
                    : "Nenhuma fala reconhecida.";
            }

            resetVoiceTranscript();
            updateVoiceButton();
        });
    } else {
        voiceButton.disabled = true;
        voiceButton.title =
            "Este navegador não oferece reconhecimento de fala.";

        voiceHint.textContent =
            "Microfone indisponível neste navegador. Você ainda pode digitar e ouvir as respostas, se a síntese de voz estiver disponível.";
    }

    voiceButton.addEventListener("click", () => {
        if (!recognition) return;

        if (isListening) {
            shouldSubmitVoice = Boolean(finalTranscript.trim());
            voiceHint.textContent = "Finalizando a gravação…";

            try {
                recognition.stop();
            } catch (error) {
                isListening = false;
                recognitionStarting = false;
                updateVoiceButton();
            }

            return;
        }

        if (sending || recognitionStarting) {
            voiceHint.textContent =
                "Aguarde a resposta atual antes de gravar outra pergunta.";
            return;
        }

        stopSpeaking();
        resetVoiceTranscript();

        if (tutorInput) {
            voiceBaseText = tutorInput.value.trim();
            tutorInput.value = "";
        }

        recognitionStarting = true;
        updateVoiceButton();
        voiceHint.textContent = "Solicitando acesso ao microfone…";

        try {
            recognition.start();
        } catch (error) {
            recognitionStarting = false;
            voiceHint.textContent =
                "Não foi possível iniciar a gravação. Tente novamente.";
            updateVoiceButton();
        }
    });

    stopVoiceButton.addEventListener("click", stopSpeaking);

    // =====================================================
    // NAVEGAÇÃO
    // =====================================================

    const pageNames = {
        inicio: "Visão geral",
        tutor: "Tutor IA",
        exercicios: "Exercícios",
        calendario: "Calendário",
        materiais: "Materiais",
        progresso: "Meu progresso"
    };

    if (dateElement) {
        dateElement.textContent = new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short"
        }).format(new Date());
    }

    function closeMobileMenu() {
        document.body.classList.remove("menu-open");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Abrir menu");
        }
    }

    function updateNavigation() {
        const currentId = window.location.hash.slice(1) || "inicio";

        navLinks.forEach((link) => {
            const active =
                link.getAttribute("href") === `#${currentId}`;

            link.classList.toggle("active", active);

            if (active) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        pages.forEach((page) => {
            page.setAttribute(
                "aria-hidden",
                String(page.id !== currentId)
            );
        });

        if (breadcrumbTitle) {
            breadcrumbTitle.textContent =
                pageNames[currentId] || "Visão geral";
        }

        closeMobileMenu();
    }

    function isValidHash(hash) {
        if (!hash || hash === "#") return false;

        try {
            return Boolean(
                document.querySelector(decodeURIComponent(hash))
            );
        } catch (error) {
            return false;
        }
    }

    if (!isValidHash(window.location.hash)) {
        window.history.replaceState(null, "", "#inicio");
    }

    window.addEventListener("hashchange", updateNavigation);

    navLinks.forEach((link) => {
        link.addEventListener("click", closeMobileMenu);
    });

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const isOpen =
                document.body.classList.toggle("menu-open");

            menuToggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Fechar menu" : "Abrir menu"
            );
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener("click", closeMobileMenu);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileMenu();
        }
    });

    updateNavigation();

    // =====================================================
    // HISTÓRICO DE CONVERSAS
    // =====================================================

    function loadHistory() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "null"
            );

            if (Array.isArray(saved)) {
                return saved
                    .filter((chat) =>
                        chat && Array.isArray(chat.messages)
                    )
                    .map((chat) => ({
                        id: String(chat.id || makeId()),
                        title: String(
                            chat.title || "Nova conversa"
                        ),
                        createdAt:
                            Number(chat.createdAt) || Date.now(),
                        updatedAt:
                            Number(chat.updatedAt) || Date.now(),
                        messages: validMessages(chat.messages)
                    }))
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, MAX_CHATS);
            }

            // Migra a conversa única da versão anterior.
            const oldMessages = JSON.parse(
                localStorage.getItem(OLD_STORAGE_KEY) || "[]"
            );

            const messages = validMessages(oldMessages);

            if (messages.length > 0) {
                const migratedChat = {
                    id: makeId(),
                    title: makeTitle(messages),
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    messages
                };

                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify([migratedChat])
                );

                return [migratedChat];
            }
        } catch (error) {
            console.warn(
                "Não foi possível carregar o histórico.",
                error
            );
        }

        return [];
    }

    let history = loadHistory();
    let activeChatId = history[0]?.id || null;

    function saveHistory() {
        history.sort((a, b) => b.updatedAt - a.updatedAt);
        history = history.slice(0, MAX_CHATS);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(history)
            );
        } catch (error) {
            console.warn(
                "Não foi possível salvar o histórico.",
                error
            );

            setStatus(
                "Não foi possível salvar as conversas neste navegador.",
                true
            );
        }
    }

    function activeChat() {
        return history.find(
            (chat) => chat.id === activeChatId
        ) || null;
    }

    function createChat() {
        const chat = {
            id: makeId(),
            title: "Nova conversa",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };

        history.unshift(chat);
        activeChatId = chat.id;

        saveHistory();
        renderHistory();
        renderChat();

        setStatus("Nova conversa pronta.");

        if (tutorInput) tutorInput.focus();

        return chat;
    }

    function renderHistory() {
        if (!historyList) return;

        historyList.replaceChildren();

        const sortedHistory = [...history].sort(
            (a, b) => b.updatedAt - a.updatedAt
        );

        if (sortedHistory.length === 0) {
            const empty = document.createElement("p");
            empty.className = "history-empty";
            empty.textContent =
                "Suas conversas aparecerão aqui.";

            historyList.append(empty);
            return;
        }

        sortedHistory.forEach((chat) => {
            const item = document.createElement("div");
            item.className = "history-item";

            const openButton = document.createElement("button");
            openButton.type = "button";
            openButton.className = "history-open";
            openButton.textContent = chat.title;
            openButton.title = chat.title;

            if (chat.id === activeChatId) {
                openButton.classList.add("active");
            }

            openButton.addEventListener("click", () => {
                if (sending || activeChatId === chat.id) return;

                activeChatId = chat.id;

                renderHistory();
                renderChat();
                setStatus("Conversa aberta.");

                if (window.location.hash !== "#tutor") {
                    window.location.hash = "tutor";
                }
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "history-delete";
            deleteButton.textContent = "×";
            deleteButton.title = "Excluir conversa";
            deleteButton.setAttribute(
                "aria-label",
                `Excluir conversa: ${chat.title}`
            );

            deleteButton.addEventListener("click", () => {
                if (sending) return;

                const confirmed = window.confirm(
                    `Excluir a conversa "${chat.title}"?`
                );

                if (!confirmed) return;

                history = history.filter(
                    (entry) => entry.id !== chat.id
                );

                if (activeChatId === chat.id) {
                    activeChatId = history[0]?.id || null;
                }

                if (!activeChatId) {
                    const replacement = {
                        id: makeId(),
                        title: "Nova conversa",
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        messages: []
                    };

                    history.unshift(replacement);
                    activeChatId = replacement.id;
                }

                saveHistory();
                renderHistory();
                renderChat();
                setStatus("Histórico atualizado.");
            });

            item.append(openButton, deleteButton);
            historyList.append(item);
        });
    }

    // =====================================================
    // MENSAGENS DO CHAT
    // =====================================================

    function addChatMessage(role, content) {
        if (!chatMessages) return null;

        const article = document.createElement("article");

        article.className =
            `chat-message ${
                role === "user"
                    ? "user-message"
                    : "assistant-message"
            }`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = role === "user" ? "Você" : "✳";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        const name = document.createElement("strong");
        name.textContent =
            role === "user" ? "Você" : "Tutor EduVexa";

        const paragraph = document.createElement("p");
        paragraph.textContent = content;

        bubble.append(name, paragraph);
        article.append(avatar, bubble);
        chatMessages.append(article);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        return article;
    }

    function renderChat() {
        if (!chatMessages) return;

        chatMessages.replaceChildren();

        const chat = activeChat();

        if (!chat || chat.messages.length === 0) {
            const welcome = document.createElement("p");
            welcome.className = "history-empty";
            welcome.textContent =
                "Olá! Sou seu Tutor EduVexa. O que você quer aprender hoje?";

            chatMessages.append(welcome);
            return;
        }

        chat.messages.forEach((message) => {
            addChatMessage(message.role, message.content);
        });
    }

    function saveActiveChat() {
        const chat = activeChat();
        if (!chat) return;

        chat.title = makeTitle(chat.messages);
        chat.updatedAt = Date.now();

        saveHistory();
        renderHistory();
    }

    if (newChatButton) {
        newChatButton.addEventListener("click", () => {
            if (sending) return;

            createChat();

            if (window.location.hash !== "#tutor") {
                window.location.hash = "tutor";
            }

            closeMobileMenu();
        });
    }

    // =====================================================
    // ENVIO DE PERGUNTAS PARA O BACKEND
    // =====================================================

    if (
        tutorForm &&
        tutorInput &&
        tutorSend &&
        chatMessages &&
        tutorStatus
    ) {
        tutorForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const messageText = tutorInput.value.trim();

            if (!messageText || sending) return;

            stopSpeaking();

            if (!activeChat()) {
                createChat();
            }

            const chat = activeChat();
            if (!chat) return;

            chat.messages.push({
                role: "user",
                content: messageText
            });

            chat.messages = chat.messages.slice(-MAX_MESSAGES);

            addChatMessage("user", messageText);
            tutorInput.value = "";

            sending = true;
            tutorSend.disabled = true;
            tutorInput.disabled = true;
            updateVoiceButton();

            setStatus("O tutor está pensando…");
            voiceHint.textContent = "Aguardando a resposta…";

            saveActiveChat();

            const typing = addChatMessage(
                "assistant",
                "Estou preparando uma explicação…"
            );

            typing?.querySelector("p")?.classList.add("chat-typing");

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/tutor`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            messages: chat.messages.slice(-12)
                        })
                    }
                );

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.detail ||
                        `O servidor respondeu com erro (${response.status}).`
                    );
                }

                const answer =
                    typeof data.resposta === "string" &&
                    data.resposta.trim()
                        ? data.resposta.trim()
                        : "Não recebi uma resposta desta vez.";

                if (typing) {
                    const paragraph = typing.querySelector("p");

                    if (paragraph) {
                        paragraph.textContent = answer;
                        paragraph.classList.remove("chat-typing");
                    }
                } else {
                    addChatMessage("assistant", answer);
                }

                chat.messages.push({
                    role: "assistant",
                    content: answer
                });

                chat.messages = chat.messages.slice(-MAX_MESSAGES);

                setStatus("Resposta recebida. Pode perguntar mais!");

                speakAnswer(answer);

            } catch (error) {
                typing?.remove();

                const message =
                    error instanceof TypeError
                        ? "Não consegui acessar o backend. Verifique sua conexão e tente novamente."
                        : error.message || "Ocorreu um erro inesperado.";

                setStatus(message, true);

                voiceHint.textContent =
                    "A pergunta não recebeu resposta. Você pode tentar novamente.";

            } finally {
                saveActiveChat();

                sending = false;
                tutorSend.disabled = false;
                tutorInput.disabled = false;

                updateVoiceButton();

                tutorInput.focus();
            }
        });

        tutorInput.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                tutorForm.requestSubmit();
            }
        });
    }

    // =====================================================
    // INICIALIZAÇÃO
    // =====================================================

    renderHistory();
    renderChat();
    updateVoiceButton();
});
