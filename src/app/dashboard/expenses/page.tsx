import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import ExpensesClient from './ExpensesClient'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
    const isAdmin = await checkRole('admin')

    if (!isAdmin) {
        redirect('/denied')
    }

    return <ExpensesClient />
}
