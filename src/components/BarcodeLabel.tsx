'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeLabelProps {
    value: string
    name: string
    price: string
    currencySymbol: string
}

export default function BarcodeLabel({ value, name, price, currencySymbol }: BarcodeLabelProps) {
    const barcodeRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, value, {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 12,
                    margin: 10,
                    background: "#ffffff"
                })
            } catch (err) {
                console.error("Barcode generation failed:", err)
            }
        }
    }, [value])

    return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm inline-block print:shadow-none print:border-none">
            <div className="text-center mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">BardPOS Protocol</p>
                <h3 className="text-sm font-black text-slate-900 truncate max-w-[200px] leading-tight">{name}</h3>
                <p className="text-xs font-black text-blue-600 mt-0.5 italic">{currencySymbol}{price}</p>
            </div>
            <div className="flex justify-center bg-white p-1 rounded border border-gray-50">
                <svg ref={barcodeRef} className="max-w-[180px] h-auto"></svg>
            </div>
            <div className="text-center mt-1">
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] italic">Identity Signature Required</p>
            </div>
        </div>
    )
}
