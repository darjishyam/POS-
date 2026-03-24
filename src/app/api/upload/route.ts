import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.json()
        const { image, filename } = formData

        if (!image) {
            return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
        }

        // Base64 to Buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
        const buffer = Buffer.from(base64Data, 'base64')

        const ext = filename.split('.').pop() || 'png'
        const newFilename = `${uuidv4()}.${ext}`
        const uploadPath = path.join(process.cwd(), 'public', 'uploads', newFilename)

        await writeFile(uploadPath, buffer)

        return NextResponse.json({ 
            url: `/uploads/${newFilename}`,
            success: true 
        })
    } catch (error) {
        console.error('Upload Error:', error)
        return NextResponse.json({ error: 'Failed to synchronize visual asset' }, { status: 500 })
    }
}
