import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import InventoryClient from './InventoryClient'

export default async function InventoryPage() {
    const isAdmin = await checkRole('admin')

    if (!isAdmin) {
        redirect('/denied')
    }

    return <InventoryClient />
}
