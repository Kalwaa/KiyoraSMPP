/* =========================================================
   KIYORASMP
   ========================================================= */

const API =
    "https://kiyorasmpp.httpskiyorasmppkiyorasmpworkersdev.workers.dev";


/* =========================================================
   ELEMENTS
   ========================================================= */

const statusElement =
    document.getElementById("status");

const startButton =
    document.getElementById("startButton");

const messageElement =
    document.getElementById("message");


let busy = false;


/* =========================================================
   TEST VISUEL
   ========================================================= */

function showMessage(text, type = "") {

    if (!messageElement) {
        return;
    }

    messageElement.textContent = text;

    messageElement.className =
        "message " + type;
}


/* =========================================================
   STATUT DU SERVEUR
   ========================================================= */

async function getStatus() {

    try {

        const response =
            await fetch(API, {
                method: "GET",
                cache: "no-store"
            });


        const data =
            await response.json();


        console.log(
            "Réponse Worker :",
            data
        );


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Erreur du Worker."
            );
        }


        /* =========================
           SERVEUR EN LIGNE
        ========================= */

        if (data.online === true) {

            statusElement.textContent =
                `● Serveur en ligne — ${data.players ?? 0}/${data.maxPlayers ?? 20}`;

            statusElement.style.color =
                "#39e49a";


            /*
             * Le serveur est déjà ouvert :
             * on n'a pas besoin de l'ouvrir.
             */

            if (startButton) {

                startButton.disabled =
                    true;

                startButton.textContent =
                    "✓ SERVEUR EN LIGNE";
            }


        } else {

            statusElement.textContent =
                "● Serveur hors ligne";

            statusElement.style.color =
                "#ff6070";


            if (startButton) {

                startButton.disabled =
                    false;

                startButton.textContent =
                    "▶  DÉMARRER LE SERVEUR";
            }
        }


    } catch (error) {

        console.error(
            "Erreur statut :",
            error
        );


        statusElement.textContent =
            "● Indisponible";

        statusElement.style.color =
            "#ff6070";


        if (startButton) {

            startButton.disabled =
                false;

            startButton.textContent =
                "▶  DÉMARRER LE SERVEUR";
        }
    }
}


/* =========================================================
   DEMARRER LE SERVEUR
   ========================================================= */

async function startServer() {

    if (busy) {
        return;
    }


    busy = true;


    if (startButton) {

        startButton.disabled =
            true;

        startButton.textContent =
            "⏳ OUVERTURE...";
    }


    showMessage(
        "⏳ Ouverture du serveur..."
    );


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


        const data =
            await response.json();


        console.log(
            "Réponse démarrage :",
            data
        );


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "MineStrator a refusé l'ouverture."
            );
        }


        showMessage(
            "✅ Ouverture du serveur demandée !"
        );


        if (startButton) {

            startButton.textContent =
                "⏳ DÉMARRAGE...";
        }


        /*
         * MineStrator prend quelques secondes
         * pour changer le statut.
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
            "Erreur démarrage :",
            error
        );


        showMessage(
            "❌ " + error.message
        );


        if (startButton) {

            startButton.disabled =
                false;

            startButton.textContent =
                "▶  DÉMARRER LE SERVEUR";
        }


    } finally {

        setTimeout(() => {

            busy = false;

        }, 2000);
    }
}


/* =========================================================
   BOUTON
   ========================================================= */

if (startButton) {

    startButton.onclick =
        startServer;
}


/* =========================================================
   INITIALISATION
   ========================================================= */

getStatus();


/* =========================================================
   ACTUALISATION AUTOMATIQUE
   ========================================================= */

setInterval(
    getStatus,
    10000
);
