/** @type {import('next').NextConfig} */

const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

console.log("🔧 [next.config] BACKEND_URL =", backendUrl);

const nextConfig = {
    async headers() {
        return [
            {
                // Allow the embedded widget (on any origin) to call /api/chat and /api/availability/*
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "Content-Type" },
                ],
            },
        ];
    },
    async rewrites() {
        return [
            {
                source: "/salon-admin/:path*",
                destination: `${backendUrl}/salon-admin/:path*`,
            },
            {
                source: "/super-admin/:path*",
                destination: `${backendUrl}/super-admin/:path*`,
            },
            {
                source: "/widget/:path*",
                destination: `${backendUrl}/widget/:path*`,
            },
            {
                source: "/salon-config/:path*",
                destination: `${backendUrl}/salon-config/:path*`,
            },
            {
                source: "/webhooks/:path*",
                destination: `${backendUrl}/webhooks/:path*`,
            },
            {
                // Proxy /api/chat and /api/availability/* to Railway
                source: "/api/:path*",
                destination: `${backendUrl}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;