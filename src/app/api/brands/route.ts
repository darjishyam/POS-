import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Fetch Brands Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, image, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        description,
        image,
        status: status ?? true
      }
    });

    return NextResponse.json(brand);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Brand name already exists' }, { status: 400 });
    }
    console.error('Create Brand Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
