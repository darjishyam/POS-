'use client'

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, Zap } from 'lucide-react'

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void
    onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const elementId = useRef(`reader-${Math.random().toString(36).substr(2, 9)}`)

    useEffect(() => {
        let isMoving = false

        // Initialize scanner with a small delay for DOM stability
        const timeoutId = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                elementId.current,
            { 
                fps: 10, 
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.777778, // 16:9
                showTorchButtonIfSupported: true,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            },
            /* verbose= */ false
        )

        scanner.render(
            (decodedText) => {
                onScan(decodedText)
            },
            () => {
                // Ignore errors (scanning noise)
            }
        )
            scannerRef.current = scanner
        }, 100)

        return () => {
            clearTimeout(timeoutId)
            if (scannerRef.current && !isMoving) {
                isMoving = true
                console.log('CLEARING SCANNER MATRIX')
                scannerRef.current.clear().catch(err => {
                    console.error("Failed to clear scanner", err)
                }).finally(() => {
                    isMoving = false
                    scannerRef.current = null
                })
            }
        }
    }, [onScan])

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
            
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <Zap className="w-6 h-6 text-emerald-600 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic leading-none">Scanning <span className="text-emerald-600 NOT-italic">Protocol</span></h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Point device camera at asset barcode</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-red-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-12">
                    <div id={elementId.current} className="w-full rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-100 bg-slate-50 min-h-[300px] flex items-center justify-center relative">
                        {/* Placeholder before initialization */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none z-0">
                            <Camera className="w-12 h-12 mb-4 animate-bounce" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Initializing Vision Matrix...</p>
                        </div>
                    </div>
                </div>

                <div className="px-12 py-8 bg-slate-50 border-t border-gray-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">
                        Auto-Discovery Mode Enabled | Supports EAN, Code128, UPC, and QR
                    </p>
                </div>
            </div>
        </div>
    )
}
