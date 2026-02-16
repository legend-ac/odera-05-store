/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['firebasestorage.googleapis.com'],
        formats: ['image/webp', 'image/avif'],
    },
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
    },
    // Optimización para producción
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
    // Transpilar dependencias para compatibilidad Vercel
    transpilePackages: ['undici', 'firebase', 'firebase-admin'],
    webpack: (config, { isServer }) => {
        // Fix para módulos con sintaxis moderna
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
}

module.exports = nextConfig
