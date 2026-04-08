import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/examtopics/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.png'],
            manifest: {
                name: 'Microsoft AI-900 Quiz App',
                short_name: 'AI-900 Quiz',
                description: 'Microsoft Azure AI Fundamentals (AI-900) Practice Quiz - Master your AI certification with AI-powered explanations',
                theme_color: '#3b82f6',
                background_color: '#ffffff',
                display: 'standalone',
                scope: '/examtopics/',
                start_url: '/examtopics/',
                orientation: 'portrait',
                icons: [
                    {
                        src: 'icon.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: 'icon.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            }
        })
    ],
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
})
