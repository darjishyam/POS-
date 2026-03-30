import { StoreHeader } from '@/components/StoreHeader'
import { OrdersClient } from './OrdersClient'

export const dynamic = 'force-dynamic'

export default function MyOrdersPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="w-full mx-auto px-6 lg:px-24 pt-12">
                <StoreHeader />
                <OrdersClient />
            </div>
        </div>
    )
}
