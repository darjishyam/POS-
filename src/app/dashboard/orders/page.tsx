import OrdersClient from './OrdersClient'

export const metadata = {
    title: 'Audit Trail | BardPOS Admin',
    description: 'Complete transaction history and revenue audit',
}

export default function OrdersPage() {
    return <OrdersClient />
}
