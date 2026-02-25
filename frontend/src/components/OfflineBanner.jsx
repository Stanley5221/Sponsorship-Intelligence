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
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-bold">You are currently offline. Using cached data.</span>
        </div>
    )
}
