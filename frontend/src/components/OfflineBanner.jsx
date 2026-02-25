import { WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    if (isOnline) return null

    return (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 shadow-lg shadow-orange-200/20 sticky top-0 z-[60]">
            <div className="bg-white/20 p-1 rounded-lg">
                <WifiOff className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                Offline Mode <span className="font-medium opacity-80 normal-case ml-1">· Using cached sponsorship data</span>
            </span>
        </div>
    )
}
