// Versão otimizada do calendário StudyMind.
const calendario =
    document.getElementById("calendario");


let mesAtual =
    new Date().getMonth();


let anoAtual =
    new Date().getFullYear();



// ==================================================
// CRIAR CALENDÁRIO
// ==================================================

function criarCalendario() {

    if (!calendario) return;


    calendario.innerHTML = "";


    // ==================================================
    // DIAS CONFIRMADOS
    // ==================================================

    let diasConfirmados = [];


    const dados =
        localStorage.getItem(
            "diasConfirmados"
        );


    if (dados) {
        try {
            const parsed = JSON.parse(dados);
            // Set deixa a verificação de cada dia rápida, mesmo com muitos registros.
            diasConfirmados = new Set(Array.isArray(parsed) ? parsed : []);
        } catch {
            diasConfirmados = new Set();
        }
    } else {
        diasConfirmados = new Set();
    }



    // ==================================================
    // DATA DE HOJE
    // ==================================================

    const dataHoje =
        new Date();


    dataHoje.setHours(
        0,
        0,
        0,
        0
    );



    // ==================================================
    // PRIMEIRO DIA DO MÊS
    // ==================================================

    const primeiroDia =
        new Date(
            anoAtual,
            mesAtual,
            1
        );


    // JavaScript usa domingo = 0.
    // Aqui transformamos para segunda = 0.

    let primeiroDiaSemana =
        primeiroDia.getDay();


    primeiroDiaSemana =
        (primeiroDiaSemana + 6) % 7;



    // ==================================================
    // QUANTIDADE DE DIAS
    // ==================================================

    const quantidadeDias =
        new Date(
            anoAtual,
            mesAtual + 1,
            0
        ).getDate();



    // ==================================================
    // NOMES DOS MESES
    // ==================================================

    const nomesMeses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];



    // ==================================================
    // CABEÇALHO
    // ==================================================

    const topo =
        document.createElement("div");

    topo.className =
        "calendario-topo";


    const botaoAnterior =
        document.createElement("button");

    botaoAnterior.className =
        "botao-mes";

    botaoAnterior.textContent =
        "‹";

    botaoAnterior.type =
        "button";


    const titulo =
        document.createElement("h3");

    titulo.textContent =
        `${nomesMeses[mesAtual]} ${anoAtual}`;


    const botaoProximo =
        document.createElement("button");

    botaoProximo.className =
        "botao-mes";

    botaoProximo.textContent =
        "›";

    botaoProximo.type =
        "button";


    topo.appendChild(
        botaoAnterior
    );

    topo.appendChild(
        titulo
    );

    topo.appendChild(
        botaoProximo
    );

    calendario.appendChild(
        topo
    );



    // ==================================================
    // DIAS DA SEMANA
    // ==================================================

    const semana =
        document.createElement("div");

    semana.className =
        "dias-semana";


    const nomesDias = [
        "SEG",
        "TER",
        "QUA",
        "QUI",
        "SEX",
        "SÁB",
        "DOM"
    ];


    nomesDias.forEach(nome => {

        const elemento =
            document.createElement("div");

        elemento.className =
            "dia-semana";

        elemento.textContent =
            nome;

        semana.appendChild(
            elemento
        );

    });


    calendario.appendChild(
        semana
    );



    // ==================================================
    // DIAS DO CALENDÁRIO
    // ==================================================

    const dias = document.createElement("div");
    dias.className = "dias-calendario";
    // Monta os dias fora do DOM e insere tudo de uma vez.
    const fragmentoDias = document.createDocumentFragment();


    // ==================================================
    // ESPAÇOS ANTES DO PRIMEIRO DIA
    // ==================================================

    for (
        let i = 0;
        i < primeiroDiaSemana;
        i++
    ) {

        const vazio =
            document.createElement("div");

        vazio.className =
            "dia vazio";

        fragmentoDias.appendChild(vazio);

    }



    // ==================================================
    // CRIAR CADA DIA
    // ==================================================

    for (
        let numero = 1;
        numero <= quantidadeDias;
        numero++
    ) {

        const elemento =
            document.createElement("div");

        elemento.className =
            "dia";

        elemento.textContent =
            numero;


        const dataDia =
            new Date(
                anoAtual,
                mesAtual,
                numero
            );


        dataDia.setHours(
            0,
            0,
            0,
            0
        );



        // ==================================================
        // DATA NO FORMATO YYYY-MM-DD
        // ==================================================

        const ano =
            dataDia.getFullYear();

        const mes =
            String(
                dataDia.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                dataDia.getDate()
            ).padStart(2, "0");


        const dataTexto =
            `${ano}-${mes}-${dia}`;



        // ==================================================
        // É HOJE?
        // ==================================================

        if (
            dataDia.getTime() ===
            dataHoje.getTime()
        ) {

            elemento.classList.add(
                "hoje"
            );

        }



        // ==================================================
        // É FUTURO?
        // ==================================================

        if (
            dataDia > dataHoje
        ) {

            elemento.classList.add(
                "futuro"
            );

        }



        // ==================================================
        // FOI CONFIRMADO?
        // ==================================================

        if (
            diasConfirmados.has(dataTexto)
        ) {

            elemento.classList.add(
                "completo"
            );


            // Criar estrela pequena

            const estrela =
                document.createElement("span");


            estrela.className =
                "estrela-dia";


            estrela.textContent =
                "⭐";


            elemento.appendChild(
                estrela
            );

        }



        fragmentoDias.appendChild(elemento);

    }


    dias.appendChild(fragmentoDias);
    calendario.appendChild(dias);



    // ==================================================
    // BOTÃO ANTERIOR
    // ==================================================

    botaoAnterior.addEventListener(
        "click",
        () => {

            mesAtual--;


            if (
                mesAtual < 0
            ) {

                mesAtual = 11;

                anoAtual--;

            }


            criarCalendario();

        }
    );



    // ==================================================
    // BOTÃO PRÓXIMO
    // ==================================================

    botaoProximo.addEventListener(
        "click",
        () => {

            mesAtual++;


            if (
                mesAtual > 11
            ) {

                mesAtual = 0;

                anoAtual++;

            }


            criarCalendario();

        }
    );

}



// ==================================================
// INICIAR
// ==================================================

criarCalendario();
