const SERVER_NAME = "KiyoraSMP";


export default {

    async fetch(request, env) {

        const cors = {

            "Access-Control-Allow-Origin": "*",

            "Access-Control-Allow-Methods":
                "GET, POST, OPTIONS",

            "Access-Control-Allow-Headers":
                "Content-Type"
        };


        /* =========================
           CORS
        ========================= */

        if (
            request.method === "OPTIONS"
        ) {

            return new Response(
                null,
                {
                    status: 204,
                    headers: cors
                }
            );
        }


        try {

            /* =========================
               API KEY
            ========================= */

            if (
                !env.MINESTRATOR_API_KEY
            ) {

                return json(
                    {
                        success: false,

                        error:
                            "MINESTRATOR_API_KEY manquante dans Cloudflare."
                    },

                    cors,
                    500
                );
            }


            /* =========================
               PROFIL
            ========================= */

            const profileResponse =
                await fetch(
                    "https://mine.sttr.io/user/profile",
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${env.MINESTRATOR_API_KEY}`,

                            "Accept":
                                "application/json"
                        }
                    }
                );


            const profileText =
                await profileResponse.text();


            let profileData;

            try {

                profileData =
                    JSON.parse(profileText);

            } catch {

                profileData = {
                    raw: profileText
                };
            }


            if (
                !profileResponse.ok
            ) {

                return json(
                    {
                        success: false,

                        error:
                            "Impossible de récupérer le profil MineStrator.",

                        status:
                            profileResponse.status,

                        details:
                            profileData
                    },

                    cors,
                    profileResponse.status
                );
            }


            /* =========================
               USER ID
            ========================= */

            const user =
                profileData?.api?.data?.user ||
                profileData?.api?.user ||
                profileData?.data?.user ||
                profileData?.user;


            const userId =
                user?.id;


            if (!userId) {

                return json(
                    {
                        success: false,

                        error:
                            "ID utilisateur MineStrator introuvable.",

                        profile:
                            profileData
                    },

                    cors,
                    500
                );
            }


            /* =========================
               SERVEURS
            ========================= */

            const serversResponse =
                await fetch(
                    `https://mine.sttr.io/user/${userId}/servers`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${env.MINESTRATOR_API_KEY}`,

                            "Accept":
                                "application/json"
                        }
                    }
                );


            const serversText =
                await serversResponse.text();


            let serversData;

            try {

                serversData =
                    JSON.parse(serversText);

            } catch {

                serversData = {
                    raw: serversText
                };
            }


            if (
                !serversResponse.ok
            ) {

                return json(
                    {
                        success: false,

                        error:
                            "Impossible de récupérer les serveurs.",

                        status:
                            serversResponse.status,

                        details:
                            serversData
                    },

                    cors,
                    serversResponse.status
                );
            }


            const servers =
                serversData?.api?.data?.servers ||
                serversData?.api?.servers ||
                serversData?.data?.servers ||
                serversData?.servers ||
                [];


            /* =========================
               TROUVER KIYORASMP
            ========================= */

            const server =
                servers.find(
                    s =>
                        String(
                            s?.name || ""
                        ).toLowerCase()
                        ===
                        SERVER_NAME.toLowerCase()
                );


            if (!server) {

                return json(
                    {
                        success: false,

                        error:
                            `Serveur "${SERVER_NAME}" introuvable.`,

                        servers:
                            servers.map(
                                s => ({
                                    id: s?.id,
                                    name: s?.name
                                })
                            )
                    },

                    cors,
                    404
                );
            }


            const serverId =
                server.id;


            const url =
                new URL(request.url);


            /* =========================
               STATUS
            ========================= */

            if (
                url.pathname === "/status" &&
                request.method === "GET"
            ) {

                const liveResponse =
                    await fetch(
                        `https://mine.sttr.io/server/${serverId}/live`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${env.MINESTRATOR_API_KEY}`,

                                "Accept":
                                    "application/json"
                            }
                        }
                    );


                const liveText =
                    await liveResponse.text();


                let liveData;

                try {

                    liveData =
                        JSON.parse(liveText);

                } catch {

                    liveData = {
                        raw: liveText
                    };
                }


                if (
                    !liveResponse.ok
                ) {

                    return json(
                        {
                            success: false,

                            error:
                                "Impossible de récupérer le statut.",

                            status:
                                liveResponse.status,

                            details:
                                liveData
                        },

                        cors,
                        liveResponse.status
                    );
                }


                const live =
                    liveData?.api?.data ||
                    liveData?.data ||
                    liveData;


                return json(
                    {
                        success: true,

                        serverId:
                            serverId,

                        online:
                            live?.state === "online",

                        players:
                            live?.stats?.players?.current ?? 0,

                        maxPlayers:
                            live?.stats?.players?.limit ?? 0
                    },

                    cors
                );
            }


            /* =========================
               POWER
            ========================= */

            if (
                url.pathname === "/power" &&
                request.method === "POST"
            ) {

                let body;


                try {

                    body =
                        await request.json();

                } catch {

                    return json(
                        {
                            success: false,

                            error:
                                "JSON invalide."
                        },

                        cors,
                        400
                    );
                }


                const action =
                    body?.action;


                if (
                    ![
                        "start",
                        "restart"
                    ].includes(action)
                ) {

                    return json(
                        {
                            success: false,

                            error:
                                "Action invalide."
                        },

                        cors,
                        400
                    );
                }


                /* =========================
                   MINESTRATOR POWER ACTION
                ========================= */

                const powerResponse =
                    await fetch(
                        `https://mine.sttr.io/server/${serverId}/poweraction`,
                        {
                            method: "PUT",

                            headers: {
                                "Authorization":
                                    `Bearer ${env.MINESTRATOR_API_KEY}`,

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    {
                                        poweraction:
                                            action
                                    }
                                )
                        }
                    );


                const powerText =
                    await powerResponse.text();


                let powerData;


                try {

                    powerData =
                        JSON.parse(powerText);

                } catch {

                    powerData = {
                        raw: powerText
                    };
                }


                /* =========================
                   ERREUR
                ========================= */

                if (
                    !powerResponse.ok
                ) {

                    return json(
                        {
                            success: false,

                            error:
                                "MineStrator a refusé l'action.",

                            httpStatus:
                                powerResponse.status,

                            action:
                                action,

                            serverId:
                                serverId,

                            details:
                                powerData
                        },

                        cors,
                        powerResponse.status
                    );
                }


                /* =========================
                   SUCCÈS
                ========================= */

                return json(
                    {
                        success: true,

                        serverId:
                            serverId,

                        action:
                            action,

                        details:
                            powerData
                    },

                    cors
                );
            }


            /* =========================
               SERVERS
            ========================= */

            if (
                url.pathname === "/servers" &&
                request.method === "GET"
            ) {

                return json(
                    {
                        success: true,

                        servers:
                            servers.map(
                                s => ({
                                    id: s?.id,
                                    name: s?.name
                                })
                            )
                    },

                    cors
                );
            }


            /* =========================
               RACINE
            ========================= */

            if (
                url.pathname === "/" &&
                request.method === "GET"
            ) {

                return json(
                    {
                        success: true,

                        worker:
                            "KiyoraSMP",

                        server:
                            SERVER_NAME,

                        serverId:
                            serverId,

                        routes: [
                            "GET /status",
                            "POST /power",
                            "GET /servers"
                        ]
                    },

                    cors
                );
            }


            /* =========================
               ROUTE INCONNUE
            ========================= */

            return json(
                {
                    success: false,

                    error:
                        "Route inconnue.",

                    route:
                        url.pathname
                },

                cors,
                404
            );


        } catch (error) {

            return json(
                {
                    success: false,

                    error:
                        error?.message ||
                        "Erreur inconnue."
                },

                cors,
                500
            );
        }
    }
};


/* =========================
   JSON
========================= */

function json(
    data,
    cors,
    status = 200
) {

    return new Response(
        JSON.stringify(
            data,
            null,
            2
        ),

        {
            status: status,

            headers: {
                ...cors,

                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "no-store"
            }
        }
    );
}
