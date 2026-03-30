import { getRole } from '@/lib/roles'
import { redirect } from 'next/navigation'
import { Hero } from '@/components/home/Hero'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import ProductShelf from '@/components/ProductShelf'
import { StoreHeader } from '../components/StoreHeader'
import { AdminRedirect } from '@/components/auth/AdminRedirect'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const role = await getRole();
  console.log('LANDING PAGE ROLE:', role);
  
  if (role === 'admin') {
    console.log('--- SERVER SIDE REDIRECT: ADMIN TO /dashboard ---');
    redirect('/dashboard')
  }

  const featuredProducts = await (prisma.product.findMany({
    take: 4,
    include: { category: true }
  }) as Promise<any[]>)

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <AdminRedirect />
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-24 relative z-10 pt-12">
        <StoreHeader />

        {/* Dynamic Hero Section */}
        <Hero />

        {/* Product Showcase Gallery */}
        <div id="gallery" className="py-24 border-t border-gray-100">
          <div className="flex justify-between items-end mb-16 px-2">
            <div>
              <h2 className="text-5xl font-black text-gray-950 tracking-tight italic">Marketplace <br/><span className="text-emerald-600 NOT-italic">Showcase</span></h2>
              <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mt-2 italic">Hand-picked premium executions.</p>
            </div>
            <Link href="/products" className="hidden md:flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all">
              SEE ENTIRE COLLECTION <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          <ProductShelf products={featuredProducts} />
        </div>

        {/* Feature Grid */}
        <div id="features" className="py-32 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-6 group">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 group-hover:-rotate-6 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight italic">Hyper-Fast Terminal</h3>
              <p className="text-gray-500 font-medium">Native execution with zero-latency product lookup and cryptographic transaction verification.</p>
            </div>

            <div className="space-y-6 group">
              <div className="w-16 h-16 bg-fuchsia-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-fuchsia-200 group-hover:-rotate-6 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight italic">Neural Analytics</h3>
              <p className="text-gray-500 font-medium">Real-time revenue tracking, expense logs, and profit margins protected by Role-Based Access.</p>
            </div>

            <div className="space-y-6 group">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 group-hover:-rotate-6 transition-transform">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tight italic">Automated Ops</h3>
              <p className="text-gray-500 font-medium">Smart inventory management that automatically decrements stock upon successful checkout.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-20 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.4em]">© 2026 POS System • Powered by Intelligent Core</p>
          <div className="flex gap-8">
            <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors text-[10px] font-black uppercase tracking-widest">Twitter</a>
            <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors text-[10px] font-black uppercase tracking-widest">Github</a>
            <a href="#" className="text-gray-400 hover:text-emerald-600 transition-colors text-[10px] font-black uppercase tracking-widest">Docs</a>
          </div>
        </footer>
      </div>
    </div>
  )
}
