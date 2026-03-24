import CustomSignIn from "@/components/auth/CustomSignIn";
import Image from "next/image";

export default function Page() {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white selection:bg-slate-900 selection:text-white">
            {/* Left Section: Visual Impact (Hidden on mobile) */}
            <div className="hidden lg:relative lg:flex flex-col justify-between p-12 bg-slate-900 overflow-hidden">
                {/* Background Artwork */}
                <Image 
                    src="/images/auth-visual.png" 
                    alt="POS Terminal Visual" 
                    fill 
                    className="object-cover opacity-60 mix-blend-overlay scale-110 hover:scale-100 transition-transform duration-[10s] ease-linear"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/60 to-transparent" />

                {/* Content Overlay */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Secure Terminal Core</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg mb-12">
                    <h1 className="text-7xl font-black text-white tracking-tighter leading-none mb-6">
                        SYSTEM <br />
                        <span className="text-blue-500">UPLINK.</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest leading-relaxed">
                        Securely authenticate to access the enterprise terminal. Your session is protected by military-grade encryption.
                    </p>
                </div>

                {/* Footer Brand */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-1 bg-blue-500" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Auth Distributed v2.4.0</p>
                </div>
            </div>

            {/* Right Section: Interactive Auth */}
            <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-white relative overflow-hidden">
                {/* Decorative Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 -z-10" />

                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 lg:text-left text-center">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-tight">
                            System <br />
                            <span className="text-slate-400 NOT-italic">Authentication</span>
                        </h2>
                        <div className="mt-4 w-12 h-1 bg-slate-900 lg:mx-0 mx-auto" />
                    </div>

                    <CustomSignIn />
                </div>
            </div>
        </div>
    );
}
