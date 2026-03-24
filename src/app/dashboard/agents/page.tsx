import Header from '@/components/Header'
import AgentsClient from './AgentsClient'

export default function AgentsPage() {
    return (
        <div className="p-8 md:p-12 min-h-screen bg-[#f8fafc] font-sans">
            <Header />
            <AgentsClient />
        </div>
    )
}
