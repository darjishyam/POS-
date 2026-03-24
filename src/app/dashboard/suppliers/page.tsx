import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import SuppliersClient from './SuppliersClient'

export const dynamic = 'force-dynamic'

export default async function SuppliersPage() {
    const isAdmin = await checkRole('admin')

    if (!isAdmin) {
        redirect('/denied')
    }

    return <SuppliersClient />
}
