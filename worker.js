const SERVER_NAME = "KiyoraSMP";

const MINESTRATOR_API = "https://mine.sttr.io";

export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store"
    };

    // ==================================================
    // CORS
    // ==================================================

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    try {

      // ==================================================
      // VERIFICATION CLE
      // ==================================================

      if (!env.MINESTRATOR_API_KEY) {
        return json({
          success: false,
          error: "Configuration serveur manquante."
        }, cors, 500);
      }

      const authHeaders = {
        "Authorization":
          `Bearer ${env.MINESTRATOR_API_KEY}`,
        "Accept":
          "application/json"
      };


      // ==================================================
      // RECUPERER LE PROFIL
      // GET /user
      // ==================================================

      const profileResponse = await fetch(
        `${MINESTRATOR_API}/user`,
        {
          method: "GET",
          headers: authHeaders
        }
      );

      const profileText =
        await profileResponse.text();

      let profileData = {};

      try {
        profileData =
          JSON.parse(profileText);
      } catch {}

      if (!profileResponse.ok) {

        return json({
          success: false,
          error: "Clé API MineStrator refusée."
        }, cors, 502);
      }


      // ==================================================
      // RECUPERER ID UTILISATEUR
      // ==================================================

      const user =
        profileData?.api?.data?.user ||
        profileData?.data?.user ||
        profileData?.user;

      const userId =
        user?.datas?.id ||
        user?.id;

      if (!userId) {

        return json({
          success: false,
          error: "Impossible de trouver le compte MineStrator."
        }, cors, 500);
      }


      // ==================================================
      // RECUPERER LES SERVEURS
      // GET /user/{id}/servers
      // ==================================================

      const serversResponse = await fetch(
        `${MINESTRATOR_API}/user/${userId}/servers`,
        {
          method: "GET",
          headers: authHeaders
        }
      );

      const serversText =
        await serversResponse.text();

      let serversData = {};

      try {
        serversData =
          JSON.parse(serversText);
      } catch {}

      if (!serversResponse.ok) {

        return json({
          success: false,
          error: "Impossible de récupérer les serveurs MineStrator."
        }, cors, 502);
      }


      const servers =
        serversData?.api?.data?.servers ||
        serversData?.data?.servers ||
        serversData?.servers ||
        [];


      // ==================================================
      // TROUVER KIYORASMP
      // ==================================================

      const server =
        servers.find(
          s =>
            String(s?.name || "")
              .trim()
              .toLowerCase() ===
            SERVER_NAME.toLowerCase()
        );


      if (!server) {

        return json({
          success: false,
          error: "Serveur KiyoraSMP introuvable."
        }, cors, 404);
      }


      const serverId =
        server.id;


      const url =
        new URL(request.url);


      // ==================================================
      // STATUS
      //
      // GET /
      // GET /status
      // ==================================================

      if (
        request.method === "GET" &&
        (
          url.pathname === "/" ||
          url.pathname === "/status"
        )
      ) {

        const liveResponse =
          await fetch(
            `${MINESTRATOR_API}/server/${serverId}/live`,
            {
              method: "GET",
              headers: authHeaders
            }
          );


        const liveText =
          await liveResponse.text();

        let liveData = {};

        try {
          liveData =
            JSON.parse(liveText);
        } catch {}


        if (!liveResponse.ok) {

          return json({
            success: false,
            error: "Impossible de récupérer le statut."
          }, cors, 502);
        }


        const live =
          liveData?.api?.data ||
          liveData?.data ||
          liveData?.api ||
          liveData;


        const state =
          String(
            live?.state ||
            live?.status ||
            ""
          ).toLowerCase();


        const players =
          live?.stats?.players?.current ??
          live?.players?.current ??
          0;


        const maxPlayers =
          live?.stats?.players?.limit ??
          live?.players?.limit ??
          20;


        return json({

          success: true,

          server: SERVER_NAME,

          online:
            state === "online" ||
            state === "running",

          players:
            Number(players) || 0,

          maxPlayers:
            Number(maxPlayers) || 20

        }, cors);
      }


      // ==================================================
      // POWER
      //
      // SEULEMENT START
      //
      // POST /power
      // ==================================================

      if (
        request.method === "POST" &&
        url.pathname === "/power"
      ) {

        let body;

        try {

          body =
            await request.json();

        } catch {

          return json({
            success: false,
            error: "Requête invalide."
          }, cors, 400);
        }


        // ==================================================
        // SEULE ACTION AUTORISEE
        // ==================================================

        if (
          body?.action !== "start"
        ) {

          return json({
            success: false,
            error: "Action interdite."
          }, cors, 403);
        }


        // ==================================================
        // VERIFIER SI DEJA EN LIGNE
        // ==================================================

        const liveResponse =
          await fetch(
            `${MINESTRATOR_API}/server/${serverId}/live`,
            {
              method: "GET",
              headers: authHeaders
            }
          );


        if (liveResponse.ok) {

          const liveText =
            await liveResponse.text();

          let liveData = {};

          try {
            liveData =
              JSON.parse(liveText);
          } catch {}


          const live =
            liveData?.api?.data ||
            liveData?.data ||
            liveData?.api ||
            liveData;


          const state =
            String(
              live?.state ||
              live?.status ||
              ""
            ).toLowerCase();


          if (
            state === "online" ||
            state === "running"
          ) {

            return json({

              success: true,

              server: SERVER_NAME,

              online: true,

              message:
                "Le serveur est déjà en ligne."

            }, cors);
          }
        }


        // ==================================================
        // DEMARRER LE SERVEUR
        //
        // PUT /server/{id}/poweraction
        // ==================================================

        const powerResponse =
          await fetch(
            `${MINESTRATOR_API}/server/${serverId}/poweraction`,
            {
              method: "PUT",

              headers: {
                ...authHeaders,

                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                poweraction: "start"
              })
            }
          );


        const powerText =
          await powerResponse.text();


        let powerData = {};

        try {
          powerData =
            JSON.parse(powerText);
        } catch {}


        // ==================================================
        // MINESTRATOR A REFUSE
        // ==================================================

        if (!powerResponse.ok) {

          /*
           * On ne renvoie PAS la réponse brute
           * de MineStrator.
           *
           * On donne seulement le code HTTP.
           */

          return json({

            success: false,

            error:
              "MineStrator a refusé le démarrage.",

            httpStatus:
              powerResponse.status

          }, cors, 502);
        }


        // ==================================================
        // DEMARRAGE ACCEPTE
        // ==================================================

        return json({

          success: true,

          server: SERVER_NAME,

          action: "start",

          message:
            "Démarrage de KiyoraSMP demandé."

        }, cors);
      }


      // ==================================================
      // AUTRES ROUTES BLOQUEES
      // ==================================================

      return json({

        success: false,

        error:
          "Route inconnue."

      }, cors, 404);


    } catch (error) {

      console.error(
        "Worker error:",
        error
      );

      return json({

        success: false,

        error:
          "Erreur interne du serveur."

      }, cors, 500);
    }
  }
};


// ======================================================
// JSON
// ======================================================

function json(
  data,
  cors,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,

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
