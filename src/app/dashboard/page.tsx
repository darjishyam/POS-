import { getRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const role = await getRole()

  if (role === 'admin') {
    return <DashboardClient isAdmin={true} />
  }

  if (role === 'user') {
    redirect('/pos')
  }

  // Default for Customers (who don't use the system) or unknown roles
  redirect('/denied')
}
