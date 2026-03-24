import CustomerGroupsClient from './CustomerGroupsClient'

export const metadata = {
    title: 'Client Classification | BardPOS Admin',
    description: 'Manage customer tiers and discount structures',
}

export default function CustomerGroupsPage() {
    return <CustomerGroupsClient />
}
