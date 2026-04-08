import AlertsClient from '@/app/dashboard/inventory/alerts/AlertsClient'

export const metadata = {
  title: 'Stock Alert Terminal | Matrix Core',
  description: 'Manage and monitor critical inventory nodes requiring immediate procurement.'
}

export default function AlertsPage() {
  return <AlertsClient />
}
