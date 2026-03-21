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
    const proxyTarget = env.VITE_PROXY_TARGET || env.VITE_APP_API_URL;

    if (!proxyTarget) {
        throw new Error(
            "Missing proxy target: set VITE_PROXY_TARGET (or VITE_APP_API_URL) in env.",
        );
    }

    return {
        base: appBase,
        plugins: [react(), trailingSlashRedirectPlugin(appBase)],
        server: {
            port: 6060,
            open: false,
            proxy: {
                "/api": {
                    target: proxyTarget,
                    changeOrigin: true,
                },
            },
        },
    };
});
