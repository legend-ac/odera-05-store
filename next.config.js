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
}

module.exports = nextConfig
