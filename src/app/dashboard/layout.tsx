import AdminSidebar from '@/components/AdminSidebar'
import { getRole, isEmailVerified } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const role = await getRole()
    const verified = await isEmailVerified()

    // Safety check: Only Verified Admins can access the dashboard
    if (role !== 'admin') {
        redirect('/denied')
    }

    // Bypass verification for the primary administrator to prevent loops
    const isAdminEmail = role === 'admin'; 

    if (!verified && !isAdminEmail) {
        redirect('/verify-email')
    }

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            <AdminSidebar />
            <main className="flex-1 ml-72 min-h-screen relative">
                {children}
            </main>
        </div>
    )
}
