const API =
    "https://kiyorasmpp.httpskiyorasmppkiyorasmpworkersdev.workers.dev";

const SERVER_IP =
    "kiyorasmp.minecraft.how";


const statusElement =
    document.getElementById("status");

const playersElement =
    document.getElementById("players");

const openButton =
    document.getElementById("openButton");

const restartButton =
    document.getElementById("restartButton");

const messageElement =
    document.getElementById("message");


let busy = false;


/* =========================
   STATUS
========================= */

async function getStatus() {

    try {

        const response =
            await fetch(
                API + "/status",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            throw new Error(
                data.error ||
                "Impossible de récupérer le statut."
            );
        }


        if (data.online) {

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


        playersElement.textContent =
            `${data.players ?? 0} / ${data.maxPlayers ?? "--"}`;


    } catch (error) {

        console.error(error);

        statusElement.textContent =
            "● Indisponible";

        statusElement.style.color =
            "#ff6070";

        playersElement.textContent =
            "-- / --";
    }
}


/* =========================
   OUVRIR / REDÉMARRER
========================= */

async function powerServer(action) {

    if (busy) {
        return;
    }


    busy = true;

    openButton.disabled =
        true;

    restartButton.disabled =
        true;


    if (action === "start") {

        messageElement.textContent =
            "⏳ Ouverture du serveur...";

    } else {

        messageElement.textContent =
            "⏳ Redémarrage du serveur...";
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
                        action: action
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok ||
            !data.success) {

            /*
             * Affiche la vraie erreur
             * renvoyée par MineStrator.
             */

            let errorText =
                data.error ||
                "Action refusée.";


            if (data.httpStatus) {

                errorText +=
                    ` (${data.httpStatus})`;
            }


            if (data.details) {

                console.error(
                    "Réponse MineStrator :",
                    data.details
                );
            }


            throw new Error(
                errorText
            );
        }


        if (action === "start") {

            messageElement.textContent =
                "✅ Ouverture demandée !";

        } else {

            messageElement.textContent =
                "✅ Redémarrage demandé !";
        }


        /*
         * MineStrator peut mettre
         * quelques secondes à actualiser
         * le statut.
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

        console.error(error);

        messageElement.textContent =
            "❌ " + error.message;

    } finally {

        setTimeout(() => {

            busy = false;

            openButton.disabled =
                false;

            restartButton.disabled =
                false;

        }, 1500);
    }
}


/* =========================
   COPIER IP
========================= */

async function copyIP() {

    try {

        await navigator.clipboard.writeText(
            SERVER_IP
        );


        const toast =
            document.getElementById("toast");


        toast.classList.add(
            "show"
        );


        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 1800);


    } catch {

        alert(
            "IP du serveur : " +
            SERVER_IP
        );
    }
}


/* =========================
   INITIALISATION
========================= */

getStatus();


/*
 * Actualisation toutes les 10 secondes.
 */

setInterval(
    getStatus,
    10000
);
