document.addEventListener("DOMContentLoaded", () => {
    // CONFIGURAÇÃO
    const API_BASE_URL = "https://axilio-de-estudos.onrender.com";
    const STORAGE_KEY = "studymind_tutor_history_v1";
    const OLD_STORAGE_KEY = "studymind_tutor_conversation_v1";

    // ELEMENTOS DA INTERFACE
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

    const pageNames = {
        inicio: "Visão geral",
        tutor: "Tutor IA",
        exercicios: "Exercícios",
        calendario: "Calendário",
        materiais: "Materiais",
        progresso: "Meu progresso"
    };

    // DATA
    if (dateElement) {
        dateElement.textContent = new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short"
        }).format(new Date());
    }

    // NAVEGAÇÃO
    function updateNavigation() {
        const currentId = window.location.hash.slice(1) || "inicio";

        navLinks.forEach((link) => {
            const active = link.getAttribute("href") === `#${currentId}`;
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

    function closeMobileMenu() {
        document.body.classList.remove("menu-open");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Abrir menu");
        }
    }

    if (
        !window.location.hash ||
        !document.querySelector(window.location.hash)
    ) {
        window.history.replaceState(null, "", "#inicio");
    }

    window.addEventListener("hashchange", updateNavigation);

    if (menuToggle) {
        menuToggle.addEventListener("click", () => {
            const isOpen = document.body.classList.toggle("menu-open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));
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
        if (event.key === "Escape") closeMobileMenu();
    });

    updateNavigation();

    // HISTÓRICO
    function makeId() {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function validMessages(messages) {
        if (!Array.isArray(messages)) return [];

        return messages.filter((message) =>
            message &&
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string" &&
            message.content.trim().length > 0
        ).slice(-60);
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

    function loadHistory() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "null"
            );

            if (Array.isArray(saved)) {
                return saved
                    .filter((chat) => chat && Array.isArray(chat.messages))
                    .map((chat) => ({
                        id: String(chat.id || makeId()),
                        title: String(chat.title || "Nova conversa"),
                        createdAt: Number(chat.createdAt) || Date.now(),
                        updatedAt: Number(chat.updatedAt) || Date.now(),
                        messages: validMessages(chat.messages)
                    }))
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .slice(0, 50);
            }

            // Migra a memória da versão anterior sem apagar a conversa.
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
            console.warn("Não foi possível carregar o histórico.", error);
        }

        return [];
    }

    let history = loadHistory();
    let activeChatId = history[0]?.id || null;
    let sending = false;

    function saveHistory() {
        history.sort((a, b) => b.updatedAt - a.updatedAt);
        history = history.slice(0, 50);

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.warn("Não foi possível salvar o histórico.", error);

            if (tutorStatus) {
                tutorStatus.classList.add("error");
                tutorStatus.textContent =
                    "Não foi possível salvar as conversas neste navegador.";
            }
        }
    }

    function activeChat() {
        return history.find((chat) => chat.id === activeChatId) || null;
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

        if (tutorStatus) {
            tutorStatus.classList.remove("error");
            tutorStatus.textContent = "Nova conversa pronta.";
        }

        if (tutorInput) tutorInput.focus();
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
            empty.textContent = "Suas conversas aparecerão aqui.";
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
                if (sending) return;

                activeChatId = chat.id;
                renderHistory();
                renderChat();

                if (tutorStatus) {
                    tutorStatus.classList.remove("error");
                    tutorStatus.textContent = "Conversa aberta.";
                }

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

                history = history.filter((entry) => entry.id !== chat.id);

                if (activeChatId === chat.id) {
                    activeChatId = history[0]?.id || null;
                }

                saveHistory();
                renderHistory();
                renderChat();

                if (tutorStatus) {
                    tutorStatus.classList.remove("error");
                    tutorStatus.textContent = "Histórico atualizado.";
                }
            });

            item.append(openButton, deleteButton);
            historyList.append(item);
        });
    }

    // MENSAGENS
    function addChatMessage(role, content) {
        if (!chatMessages) return null;

        const article = document.createElement("article");
        article.className =
            `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = role === "user" ? "Você" : "✳";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        const name = document.createElement("strong");
        name.textContent =
            role === "user" ? "Você" : "Tutor EduVexa";

        const text = document.createElement("p");
        text.textContent = content;

        bubble.append(name, text);
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

    // MOSTRA A ÚLTIMA CONVERSA AO ABRIR A PÁGINA
    if (chatMessages) {
        renderHistory();
        renderChat();
    }

    // ENVIO PARA O BACKEND
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

            // Cria uma conversa automaticamente quando necessário.
            if (!activeChat()) {
                createChat();
            }

            const chat = activeChat();
            if (!chat) return;

            chat.messages.push({
                role: "user",
                content: messageText
            });

            addChatMessage("user", messageText);
            tutorInput.value = "";

            sending = true;
            tutorSend.disabled = true;
            tutorInput.disabled = true;

            tutorStatus.classList.remove("error");
            tutorStatus.textContent = "O tutor está pensando...";

            saveActiveChat();

            const typing = addChatMessage(
                "assistant",
                "Estou preparando uma explicação..."
            );

            typing?.querySelector("p")?.classList.add("chat-typing");

            try {
                const response = await fetch(`${API_BASE_URL}/api/tutor`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        messages: chat.messages.slice(-12)
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.detail || `O servidor respondeu com erro (${response.status}).`
                    );
                }

                const answer =
                    data.resposta || "Não recebi uma resposta desta vez.";

                if (typing) {
                    typing.querySelector("p").textContent = answer;
                    typing.querySelector("p").classList.remove("chat-typing");
                } else {
                    addChatMessage("assistant", answer);
                }

                chat.messages.push({
                    role: "assistant",
                    content: answer
                });

                tutorStatus.classList.remove("error");
                tutorStatus.textContent =
                    "Resposta recebida. Pode perguntar mais!";

            } catch (error) {
                typing?.remove();

                tutorStatus.classList.add("error");

                if (error instanceof TypeError) {
                    tutorStatus.textContent =
                        "Não consegui acessar o backend. Verifique sua conexão e tente novamente.";
                } else {
                    tutorStatus.textContent = error.message;
                }

                // A pergunta continua salva para você não perder o que escreveu.
            } finally {
                saveActiveChat();
                renderHistory();

                sending = false;
                tutorSend.disabled = false;
                tutorInput.disabled = false;
                tutorInput.focus();
            }
        });

        tutorInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                tutorForm.requestSubmit();
            }
        });
    }

    // PRIMEIRA RENDERIZAÇÃO
    renderHistory();
    renderChat();
});
