import SettingsClient from './SettingsClient'

export const metadata = {
    title: 'System Settings | BardPOS',
    description: 'Global system configuration protocol',
}

export default function SettingsPage() {
    return <SettingsClient />
}
