import { onRequestGet as __api_callback_js_onRequestGet } from "C:\\Users\\bc200\\Nextcloud2\\coding projects\\bcs\\functions\\api\\callback.js"
import { onRequest as __api_hub_js_onRequest } from "C:\\Users\\bc200\\Nextcloud2\\coding projects\\bcs\\functions\\api\\hub.js"
import { onRequest as __api_stats_js_onRequest } from "C:\\Users\\bc200\\Nextcloud2\\coding projects\\bcs\\functions\\api\\stats.js"

export const routes = [
    {
      routePath: "/api/callback",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_callback_js_onRequestGet],
    },
  {
      routePath: "/api/hub",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_hub_js_onRequest],
    },
  {
      routePath: "/api/stats",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_stats_js_onRequest],
    },
  ]