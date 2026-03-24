import StockTransferClient from './StockTransferClient'

export const metadata = {
    title: 'Global Logistics | BardPOS Admin',
    description: 'Manage inter-site stock transfers and movement',
}

export default function StockTransfersPage() {
    return <StockTransferClient />
}
