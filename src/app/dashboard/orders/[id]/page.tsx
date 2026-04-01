import { checkRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import TransactionDetails from '@/components/TransactionDetails'

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const isAdmin = await checkRole('admin')
    if (!isAdmin) redirect('/denied')

    const { id } = await params
    const settings = await prisma.setting.findUnique({ where: { id: 'system' } })

    return (
        <TransactionDetails 
            transactionId={id} 
            type="SALE" 
            currencySymbol={settings?.currencySymbol || '$'} 
        />
    )
}
