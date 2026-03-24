'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AdminRedirect() {
    const { user, role } = useAuth()
    const router = useRouter()

    useEffect(() => {
        console.log('AdminRedirect: Checking role...', role);
        if (role === "admin") {
            console.log('AdminRedirect: Redirecting to /dashboard');
            router.push('/dashboard')
        }
    }, [user, role, router])

    return null
}
