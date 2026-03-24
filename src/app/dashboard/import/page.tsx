import ImportClient from './ImportClient'

export const metadata = {
    title: 'Data Ingestion | BardPOS Admin',
    description: 'Import industrial entity manifests into the registry',
}

export default function ImportPage() {
    return <ImportClient />
}
