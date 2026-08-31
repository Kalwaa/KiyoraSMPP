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

const messageElement =
    document.getElementById("message");

let busy = false;


/* =========================
   STATUT DU SERVEUR
========================= */

async function getStatus() {

    try {

        // On utilise directement /
        // car c'est l'URL que ton Worker
        // confirme fonctionner.

        const response = await fetch(API, {
            method: "GET",
            cache: "no-store"
        });

        const data = await response.json();

        console.log("STATUT WORKER :", data);

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Statut indisponible."
            );
        }


        /* =========================
           SERVEUR EN LIGNE
        ========================= */

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


        /* =========================
           JOUEURS
        ========================= */

        playersElement.textContent =
            `${data.players ?? 0} / ${data.maxPlayers ?? 20}`;


    } catch (error) {

        console.error(
            "Erreur statut :",
            error
        );

        statusElement.textContent =
            "● Indisponible";

        statusElement.style.color =
            "#ff6070";

        playersElement.textContent =
            "-- / --";
    }
}


/* =========================
   OUVRIR LE SERVEUR
========================= */

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

        const response = await fetch(
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
            "REPONSE OUVERTURE :",
            data
        );


        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                "Impossible d'ouvrir le serveur."
            );
        }


        if (messageElement) {
            messageElement.textContent =
                "✅ Ouverture du serveur demandée !";
        }


        /*
         * On vérifie plusieurs fois,
         * car MineStrator peut prendre
         * quelques secondes.
         */

        setTimeout(getStatus, 2000);
        setTimeout(getStatus, 5000);
        setTimeout(getStatus, 10000);


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


/* =========================
   COPIER L'IP
========================= */

async function copyIP() {

    try {

        await navigator.clipboard.writeText(
            SERVER_IP
        );


        const toast =
            document.getElementById("toast");


        if (toast) {

            toast.classList.add("show");

            setTimeout(() => {

                toast.classList.remove("show");

            }, 1800);
        }


    } catch {

        alert(
            "IP du serveur : " +
            SERVER_IP
        );
    }
}


/* =========================
   BOUTON OUVRIR
========================= */

if (openButton) {

    openButton.addEventListener(
        "click",
        openServer
    );
}


/* =========================
   INITIALISATION
========================= */

getStatus();


/*
 * Actualisation automatique
 * toutes les 10 secondes.
 */

setInterval(
    getStatus,
    10000
);
