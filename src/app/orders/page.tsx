import { StoreHeader } from '@/components/StoreHeader'
import { OrdersClient } from './OrdersClient'

export const dynamic = 'force-dynamic'

export default function MyOrdersPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12">
                <StoreHeader />
                <OrdersClient />
            </div>
        </div>
    )
}
