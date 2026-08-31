/* =========================================================
   KIYORASMP — SCRIPT.JS
   ========================================================= */

const API =
    "https://kiyorasmpp.httpskiyorasmppkiyorasmpworkersdev.workers.dev";

const SERVER_IP =
    "kiyorasmp.minecraft.how";


/* =========================================================
   ELEMENTS DU SITE
   ========================================================= */

const statusElement =
    document.getElementById("status");

const playersElement =
    document.getElementById("players");

const openButton =
    document.getElementById("openButton");

const messageElement =
    document.getElementById("message");


let busy = false;


/* =========================================================
   MINI TEST VISUEL
   ========================================================= */

const testBox = document.createElement("div");

testBox.id = "workerTest";

testBox.innerHTML = `
    <div style="
        margin-top:20px;
        padding:12px 15px;
        border:1px solid #1f3b35;
        border-radius:10px;
        background:#08110f;
        font-family:Arial,sans-serif;
        font-size:13px;
        text-align:left;
    ">
        <div id="workerTestTitle"
             style="font-weight:bold;margin-bottom:6px;">
            🔄 Test du Worker...
        </div>

        <div id="workerTestStatus"
             style="opacity:.75;">
            Connexion en cours...
        </div>

        <pre id="workerTestData"
             style="
                margin-top:8px;
                white-space:pre-wrap;
                word-break:break-word;
                font-size:11px;
                opacity:.65;
             "></pre>
    </div>
`;

document.body.appendChild(testBox);


const workerTestTitle =
    document.getElementById("workerTestTitle");

const workerTestStatus =
    document.getElementById("workerTestStatus");

const workerTestData =
    document.getElementById("workerTestData");


/* =========================================================
   AFFICHAGE DU TEST
   ========================================================= */

function testMessage(
    title,
    status,
    data = ""
) {

    workerTestTitle.textContent =
        title;

    workerTestStatus.textContent =
        status;

    workerTestData.textContent =
        data;
}


/* =========================================================
   STATUT DU SERVEUR
   ========================================================= */

async function getStatus() {

    try {

        testMessage(
            "🔄 Test du Worker...",
            "Connexion à l'API..."
        );


        /*
         * IMPORTANT :
         *
         * On appelle directement /
         * et PAS /status.
         */

        const response =
            await fetch(API, {
                method: "GET",
                cache: "no-store"
            });


        const rawText =
            await response.text();


        console.log(
            "Réponse brute du Worker :",
            rawText
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        let data;

        try {

            data =
                JSON.parse(rawText);

        } catch {

            throw new Error(
                "Le Worker n'a pas renvoyé du JSON."
            );
        }


        console.log(
            "Données Worker :",
            data
        );


        if (!data.success) {

            throw new Error(
                data.error ||
                "Le Worker a renvoyé une erreur."
            );
        }


        /* =================================================
           TEST VISUEL RÉUSSI
           ================================================= */

        testMessage(
            "🟢 Worker connecté",
            "Réponse reçue correctement.",
            JSON.stringify(
                data,
                null,
                2
            )
        );


        /* =================================================
           STATUT
           ================================================= */

        if (data.online === true) {

            statusElement.textContent =
                "● Serveur en ligne";

            statusElement.style.color =
                "#39e49a";

        } else {

            statusElement.textContent =
                "● Serveur hors ligne";

            statusElement.style.color =
                "#ff6070";
        }


        /* =================================================
           JOUEURS
           ================================================= */

        playersElement.textContent =
            `${data.players ?? 0} / ${data.maxPlayers ?? 20}`;


    } catch (error) {

        console.error(
            "Erreur Worker :",
            error
        );


        testMessage(
            "🔴 Worker inaccessible",
            error.message,
            "URL utilisée :\n" + API
        );


        statusElement.textContent =
            "● Indisponible";

        statusElement.style.color =
            "#ff6070";

        playersElement.textContent =
            "-- / --";
    }
}


/* =========================================================
   OUVRIR LE SERVEUR
   ========================================================= */

async function openServer() {

    if (busy) {
        return;
    }


    busy = true;


    if (openButton) {
        openButton.disabled = true;
    }


    if (messageElement) {

        messageElement.textContent =
            "⏳ Ouverture du serveur...";
    }


    try {

        const response =
            await fetch(
                API + "/power",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        action: "start"
                    })
                }
            );


        const rawText =
            await response.text();


        console.log(
            "Réponse ouverture :",
            rawText
        );


        let data;

        try {

            data =
                JSON.parse(rawText);

        } catch {

            throw new Error(
                "Réponse invalide du Worker."
            );
        }


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Le serveur a refusé l'ouverture."
            );
        }


        if (messageElement) {

            messageElement.textContent =
                "✅ Ouverture du serveur demandée !";
        }


        /*
         * Vérifications après le démarrage.
         */

        setTimeout(
            getStatus,
            2000
        );

        setTimeout(
            getStatus,
            5000
        );

        setTimeout(
            getStatus,
            10000
        );


    } catch (error) {

        console.error(
            "Erreur ouverture :",
            error
        );


        if (messageElement) {

            messageElement.textContent =
                "❌ " + error.message;
        }


    } finally {

        setTimeout(() => {

            busy = false;

            if (openButton) {
                openButton.disabled = false;
            }

        }, 2000);
    }
}


/* =========================================================
   BOUTON OUVRIR
   ========================================================= */

if (openButton) {

    openButton.addEventListener(
        "click",
        openServer
    );

}


/* =========================================================
   COPIER L'IP
   ========================================================= */

async function copyIP() {

    try {

        await navigator.clipboard.writeText(
            SERVER_IP
        );


        const toast =
            document.getElementById("toast");


        if (toast) {

            toast.classList.add(
                "show"
            );


            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 1800);

        }

    } catch {

        alert(
            "IP du serveur : " +
            SERVER_IP
        );
    }
}


/* =========================================================
   PREMIER TEST
   ========================================================= */

getStatus();


/* =========================================================
   ACTUALISATION
   ========================================================= */

setInterval(
    getStatus,
    10000
);
