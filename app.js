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
});
