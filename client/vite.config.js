import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const trailingSlashRedirectPlugin = (appBase) => ({
    name: "trailing-slash-redirect",
    configureServer(server) {
        // Example: /mlflow -> /mlflow/
        const baseNoSlash = appBase.endsWith("/")
            ? appBase.slice(0, -1)
            : appBase;

        server.middlewares.use((req, res, next) => {
            if (!req.url) return next();
            const [pathname, query = ""] = req.url.split("?");
            if (pathname === baseNoSlash && baseNoSlash !== "") {
                const location = `${appBase}${query ? `?${query}` : ""}`;
                res.statusCode = 302;
                res.setHeader("Location", location);
                res.end();
                return;
            }
            next();
        });
    },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const appBase = (env.VITE_APP_BASE_PATH || "/").replace(/\/+$/, "") + "/";

    return {
        base: appBase,
        plugins: [react(), trailingSlashRedirectPlugin(appBase)],
        server: {
            open: false,
            proxy: {
                "/api": {
                    target: env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
                    changeOrigin: true,
                },
            },
        },
    };
});
