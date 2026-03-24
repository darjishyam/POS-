import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import CategoriesClient from './CategoriesClient'

export default async function CategoriesPage() {
    const isAdmin = await checkRole('admin')

    if (!isAdmin) {
        redirect('/denied')
    }

    return <CategoriesClient />
}
