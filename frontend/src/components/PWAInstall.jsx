import { Download } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export default function PWAInstall() {
    const { isInstallable, installApp } = usePWAInstall()

    if (!isInstallable) return null

    return (
        <button
            onClick={installApp}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
            <Download className="w-4 h-4" />
            Install App
        </button>
    )
}
