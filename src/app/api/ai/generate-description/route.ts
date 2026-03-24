import { NextRequest, NextResponse } from 'next/server'

const NARRATIVES: Record<string, string[]> = {
    'Electronics': [
        "Engineered for peak performance, the {NAME} by {BRAND} redefines technical excellence. Featuring a sleek industrial design and robust build quality, it is the definitive choice for professionals seeking uncompromising reliability.",
        "Experience the future of connectivity with the {NAME}. {BRAND} has meticulously calibrated every component to ensure seamless integration into your high-demand workflow. Precision-milled and future-proofed.",
    ],
    'Furniture': [
        "The {NAME} embodies the intersection of ergonomic science and aesthetic sophistication. Crafted by {BRAND}, this piece brings a timeless elegance to any space while maintaining rigorous durability standards.",
        "Elevate your environment with the {NAME}. A masterclass in minimalist design from {BRAND}, utilizing premium materials and artisanal finishes to deliver both comfort and visual impact.",
    ],
    'Apparel': [
        "Tailored for the modern individual, the {NAME} by {BRAND} blends high-performance textiles with a sophisticated silhouette. Designed for versatility and longevity in any professional or casual setting.",
        "Rediscover classic style with a contemporary edge. The {NAME} highlights {BRAND}'s commitment to sustainable sourcing and precision tailoring, ensuring a perfect fit and a premium tactile experience.",
    ],
    'Default': [
        "The {NAME} from {BRAND} is a testament to quality engineering and thoughtful design. Optimized for maximum utility, it serves as a cornerstone asset in any professional inventory, delivering consistent value and performance.",
        "Quality meets innovation in the {NAME}. {BRAND} has optimized this asset for peak efficiency, ensuring it meets the most demanding operational protocols while maintaining a premium aesthetic feel.",
    ]
}

export async function POST(req: NextRequest) {
    try {
        const { name, brand, category } = await req.json()
        
        const catKey = category || 'Default'
        const templates = NARRATIVES[catKey] || NARRATIVES['Default']
        const template = templates[Math.floor(Math.random() * templates.length)]

        const description = template
            .replace(/{NAME}/g, name || 'this asset')
            .replace(/{BRAND}/g, brand || 'our premium range')

        // Simulate AI "Thinking" time for UX
        await new Promise(resolve => setTimeout(resolve, 1500))

        return NextResponse.json({ 
            description,
            success: true 
        })
    } catch (error) {
        return NextResponse.json({ error: 'AI Protocol Failure' }, { status: 500 })
    }
}
