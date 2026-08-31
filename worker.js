const SERVER_NAME = "KiyoraSMP";

const MINESTRATOR_API = "https://mine.sttr.io";

export default {
  async fetch(request, env) {

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors
      });
    }

    try {

      if (!env.MINESTRATOR_API_KEY) {
        return json({
          success: false,
          error: "Le secret MINESTRATOR_API_KEY n'est pas configuré dans Cloudflare."
        }, cors, 500);
      }

      const auth = {
        "Authorization": `Bearer ${env.MINESTRATOR_API_KEY}`
      };


      /* =========================
         1. PROFIL
      ========================= */

      const profileResponse = await fetch(
        `${MINESTRATOR_API}/user`,
        {
          headers: auth
        }
      );

      const profileData =
        await profileResponse.json();

      if (!profileResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer ton profil MineStrator.",
          details: profileData
        }, cors, profileResponse.status);
      }


      /*
       * MineStrator renvoie actuellement :
       *
       * api.data.user.datas.id
       */

      const userId =
        profileData?.api?.data?.user?.datas?.id;

      if (!userId) {
        return json({
          success: false,
          error: "ID utilisateur MineStrator introuvable.",
          profile: profileData
        }, cors, 500);
      }


      /* =========================
         2. SERVEURS
      ========================= */

      const serversResponse = await fetch(
        `${MINESTRATOR_API}/user/${userId}/servers`,
        {
          headers: auth
        }
      );

      const serversData =
        await serversResponse.json();

      if (!serversResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer tes serveurs MineStrator.",
          details: serversData
        }, cors, serversResponse.status);
      }


      const servers =
        serversData?.api?.data?.servers || [];


      /* =========================
         3. CHERCHE KIYORASMP
      ========================= */

      const server =
        servers.find(
          s =>
            String(s.name).trim().toLowerCase() ===
            SERVER_NAME.toLowerCase()
        );


      if (!server) {

        return json({
          success: false,
          error: `Serveur "${SERVER_NAME}" introuvable.`,
          servers: servers.map(s => ({
            id: s.id,
            name: s.name,
            ip: s.ip,
            dns: s.dns
          }))
        }, cors, 404);

      }


      const serverId = server.id;


      /* =========================
         ROUTES DU WORKER
      ========================= */

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
            `${MINESTRATOR_API}/server/${serverId}/live`,
            {
              headers: auth
            }
          );


        const liveData =
          await liveResponse.json();


        if (!liveResponse.ok) {

          return json({
            success: false,
            error: "Impossible de récupérer le statut du serveur.",
            details: liveData
          }, cors, liveResponse.status);

        }


        const live =
          liveData?.api?.data;


        return json({
          success: true,

          serverId: serverId,

          serverName: server.name,

          online:
            live?.state === "online",

          players:
            live?.stats?.players?.current ?? 0,

          maxPlayers:
            live?.stats?.players?.limit ?? 0
        }, cors);

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

          return json({
            success: false,
            error: "JSON invalide."
          }, cors, 400);

        }


        const allowed = [
          "start",
          "restart",
          "stop"
        ];


        if (
          !body ||
          !allowed.includes(body.action)
        ) {

          return json({
            success: false,
            error: "Action invalide. Utilise start, restart ou stop."
          }, cors, 400);

        }


        const powerResponse =
          await fetch(
            `${MINESTRATOR_API}/server/${serverId}/poweraction`,
            {
              method: "PUT",

              headers: {
                ...auth,
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                poweraction: body.action
              })
            }
          );


        const powerData =
          await powerResponse.json();


        if (!powerResponse.ok) {

          return json({
            success: false,
            error: "MineStrator a refusé l'action.",
            details: powerData
          }, cors, powerResponse.status);

        }


        return json({
          success: true,
          serverId: serverId,
          action: body.action
        }, cors);

      }


      /* =========================
         DEBUG SERVERS
      ========================= */

      if (
        url.pathname === "/servers" &&
        request.method === "GET"
      ) {

        return json({
          success: true,

          servers:
            servers.map(s => ({
              id: s.id,
              name: s.name,
              ip: s.ip,
              dns: s.dns
            }))
        }, cors);

      }


      /* =========================
         ROUTE INCONNUE
      ========================= */

      return json({
        success: false,
        error: "Route inconnue."
      }, cors, 404);


    } catch (error) {

      return json({
        success: false,
        error:
          error?.message ||
          "Erreur inconnue du Worker."
      }, cors, 500);

    }

  }
};


/* =========================
   JSON RESPONSE
========================= */

function json(
  data,
  cors,
  status = 200
) {

  return new Response(
    JSON.stringify(data, null, 2),
    {
      status: status,

      headers: {
        ...cors,
        "Content-Type":
          "application/json"
      }
    }
  );

}
