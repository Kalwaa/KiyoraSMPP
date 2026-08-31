const SERVER_NAME = "KiyoraSMP";
const API = "https://mine.sttr.io";

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
          error: "MINESTRATOR_API_KEY manquante dans Cloudflare."
        }, cors, 500);
      }

      const headers = {
        "Authorization": `Bearer ${env.MINESTRATOR_API_KEY}`
      };

      /*
       * RÉCUPÉRATION DU COMPTE
       */

      const userResponse = await fetch(
        `${API}/user`,
        { headers }
      );

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        return json({
          success: false,
          error: "MineStrator refuse la clé API.",
          details: userData
        }, cors, userResponse.status);
      }

      const user =
        userData?.api?.data?.user;

      const userId =
        user?.datas?.id;

      if (!userId) {
        return json({
          success: false,
          error: "ID utilisateur introuvable dans la réponse MineStrator.",
          details: userData
        }, cors, 500);
      }

      /*
       * RÉCUPÉRATION DES SERVEURS
       */

      const serversResponse = await fetch(
        `${API}/user/${userId}/servers`,
        { headers }
      );

      const serversData =
        await serversResponse.json();

      if (!serversResponse.ok) {
        return json({
          success: false,
          error: "Impossible de récupérer les serveurs.",
          details: serversData
        }, cors, serversResponse.status);
      }

      const servers =
        serversData?.api?.data?.servers || [];

      /*
       * CHERCHE KIYORASMP
       */

      const server = servers.find(server => {

        const name =
          String(server.name || "")
            .trim()
            .toLowerCase();

        const dns =
          String(server.dns || "")
            .trim()
            .toLowerCase();

        return (
          name === SERVER_NAME.toLowerCase() ||
          dns === "kiyorasmp.minecraft.how"
        );

      });

      if (!server) {
        return json({
          success: false,
          error: `Serveur "${SERVER_NAME}" introuvable.`,
          servers: servers.map(server => ({
            id: server.id,
            name: server.name,
            dns: server.dns,
            ip: server.ip
          }))
        }, cors, 404);
      }

      const serverId = server.id;

      const url =
        new URL(request.url);

      /*
       * =========================
       * STATUS
       * =========================
       */

      if (
        url.pathname === "/status" &&
        request.method === "GET"
      ) {

        const liveResponse = await fetch(
          `${API}/server/${serverId}/live`,
          { headers }
        );

        const liveData =
          await liveResponse.json();

        if (!liveResponse.ok) {
          return json({
            success: false,
            error: "MineStrator n'a pas pu donner le statut.",
            details: liveData
          }, cors, liveResponse.status);
        }

        const live =
          liveData?.api?.data;

        return json({
          success: true,
          online:
            live?.state === "online",

          players:
            live?.stats?.players?.current ?? 0,

          maxPlayers:
            live?.stats?.players?.limit ?? 20
        }, cors);
      }

      /*
       * =========================
       * POWER
       * =========================
       */

      if (
        url.pathname === "/power" &&
        request.method === "POST"
      ) {

        const body =
          await request.json();

        const allowed = [
          "start",
          "stop",
          "restart"
        ];

        if (
          !body ||
          !allowed.includes(body.action)
        ) {
          return json({
            success: false,
            error: "Action invalide."
          }, cors, 400);
        }

        const powerResponse =
          await fetch(
            `${API}/server/${serverId}/poweraction`,
            {
              method: "PUT",

              headers: {
                ...headers,
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                poweraction:
                  body.action
              })
            }
          );

        const powerData =
          await powerResponse.json();

        if (!powerResponse.ok) {
          return json({
            success: false,
            error:
              "MineStrator a refusé l'action.",
            details:
              powerData
          }, cors, powerResponse.status);
        }

        return json({
          success: true,
          action: body.action
        }, cors);
      }

      /*
       * =========================
       * TEST SERVEUR
       * =========================
       */

      if (
        url.pathname === "/servers" &&
        request.method === "GET"
      ) {

        return json({
          success: true,
          servers: servers.map(server => ({
            id: server.id,
            name: server.name,
            dns: server.dns,
            ip: server.ip
          }))
        }, cors);
      }

      return json({
        success: false,
        error: "Route inconnue."
      }, cors, 404);

    } catch (error) {

      return json({
        success: false,
        error:
          error?.message ||
          "Erreur inconnue."
      }, cors, 500);
    }
  }
};


function json(data, cors, status = 200) {

  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        ...cors,
        "Content-Type":
          "application/json"
      }
    }
  );
}
