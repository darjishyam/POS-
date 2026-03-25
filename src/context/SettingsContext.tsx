'use client'

import { useState, useEffect, createContext, useContext } from 'react'

interface SystemSettings {
    storeName: string
    currency: string
    currencySymbol: string
    taxRate: number
    address: string
    phone: string
    email: string
    logo: string
}

const defaultSettings: SystemSettings = {
    storeName: 'BardPOS',
    currency: 'INR',
    currencySymbol: '₹',
    taxRate: 0,
    address: '',
    phone: '',
    email: '',
    logo: ''
}

const SettingsContext = createContext<{
    settings: SystemSettings
    loading: boolean
    refresh: () => Promise<void>
}>({
    settings: defaultSettings,
    loading: true,
    refresh: async () => {}
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
    const [loading, setLoading] = useState(true)

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings')
            if (res.ok) {
                const data = await res.json()
                setSettings(data)
            }
        } catch (error) {
            console.error('Failed to fetch system settings:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    return (
        <SettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    return useContext(SettingsContext)
}
