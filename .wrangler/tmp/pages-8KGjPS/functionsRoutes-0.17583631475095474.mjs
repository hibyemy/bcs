import { onRequest as __api_hub_js_onRequest } from "C:\\Users\\bc200\\Nextcloud2\\coding projects\\bcs\\functions\\api\\hub.js"
import { onRequest as __api_stats_js_onRequest } from "C:\\Users\\bc200\\Nextcloud2\\coding projects\\bcs\\functions\\api\\stats.js"

export const routes = [
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