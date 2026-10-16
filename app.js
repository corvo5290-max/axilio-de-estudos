// StudyMind — interações iniciais da interface
// Este arquivo não contém a chave da API da Groq. A chave deverá ficar no backend.

document.addEventListener("DOMContentLoaded", () => {
    const dateElement = document.getElementById("current-date");
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = [...document.querySelectorAll(".nav-link")];
    const pages = [...document.querySelectorAll(".page")];
    const breadcrumbTitle = document.querySelector(".breadcrumb strong");

    const pageNames = {
        inicio: "Visão geral",
        tutor: "Tutor IA",
        exercicios: "Exercícios",
        calendario: "Calendário",
        materiais: "Materiais",
        progresso: "Meu progresso"
    };

    // Mostra a data atual no idioma do navegador (português do Brasil).
    if (dateElement) {
        dateElement.textContent = new Intl.DateTimeFormat("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short"
        }).format(new Date());
    }

    // Garante que a página inicial apareça quando o endereço não tiver uma seção.
    if (!window.location.hash || !document.querySelector(window.location.hash)) {
        window.history.replaceState(null, "", "#inicio");
    }

    function updateNavigation() {
        const currentId = window.location.hash.slice(1) || "inicio";

        navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${currentId}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        pages.forEach((page) => {
            const isActive = page.id === currentId;
            page.setAttribute("aria-hidden", String(!isActive));
        });

        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = pageNames[currentId] || "Visão geral";
        }

        // Fecha o menu depois da navegação, especialmente em telas pequenas.
        document.body.classList.remove("menu-open");
    }

    // Atualiza o estado visual ao clicar em links e ao usar voltar/avançar.
    window.addEventListener("hashchange", updateNavigation);
    navLinks.forEach((link) => link.addEventListener("click", () => {
        document.body.classList.remove("menu-open");
    }));

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

    // Fecha o menu móvel ao pressionar Escape.
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            document.body.classList.remove("menu-open");
            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Abrir menu");
            }
        }
    });

    updateNavigation();

    // Tutor IA: o navegador chama apenas o nosso backend, nunca a Groq diretamente.
    const tutorForm = document.getElementById("tutor-form");
    const tutorInput = document.getElementById("tutor-input");
    const tutorSend = document.getElementById("tutor-send");
    const chatMessages = document.getElementById("chat-messages");
    const tutorStatus = document.getElementById("tutor-status-message");

    // Para testar localmente. Depois da hospedagem, trocaremos pela URL HTTPS do backend.
    const API_BASE_URL = "https://axilio-de-estudos.onrender.com";
    const conversation = [];

    function addChatMessage(role, content) {
        const article = document.createElement("article");
        article.className = `chat-message ${role === "user" ? "user-message" : "assistant-message"}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = role === "user" ? "Você" : "✳";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        const name = document.createElement("strong");
        name.textContent = role === "user" ? "Você" : "Tutor StudyMind";
        const text = document.createElement("p");
        text.textContent = content;
        bubble.append(name, text);
        article.append(avatar, bubble);
        chatMessages.append(article);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return article;
    }

    if (tutorForm && tutorInput && tutorSend && chatMessages && tutorStatus) {
        tutorForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const mensagem = tutorInput.value.trim();
            if (!mensagem || tutorSend.disabled) return;

            addChatMessage("user", mensagem);
            conversation.push({ role: "user", content: mensagem });
            tutorInput.value = "";
            tutorSend.disabled = true;
            tutorInput.disabled = true;
            tutorStatus.classList.remove("error");
            tutorStatus.textContent = "O tutor está pensando...";

            const typing = addChatMessage("assistant", "Estou preparando uma explicação...");
            typing.querySelector("p").classList.add("chat-typing");

            try {
                const response = await fetch(`${API_BASE_URL}/api/tutor`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: conversation.slice(-12) })
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.detail || "Não consegui falar com o tutor.");
                }
                const resposta = data.resposta || "Não recebi uma resposta desta vez.";
                typing.querySelector("p").textContent = resposta;
                typing.querySelector("p").classList.remove("chat-typing");
                conversation.push({ role: "assistant", content: resposta });
                tutorStatus.textContent = "Resposta recebida. Pode perguntar mais!";
            } catch (error) {
                typing.remove();
                conversation.pop();
                tutorStatus.classList.add("error");
                tutorStatus.textContent = error.message.includes("Failed to fetch")
                    ? "Não consegui acessar o backend. Confira se o servidor Python está rodando."
                    : error.message;
                addChatMessage("assistant", "Tente novamente quando a conexão estiver funcionando.");
            } finally {
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
});
