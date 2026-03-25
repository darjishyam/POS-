import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(units);
  } catch (error) {
    console.error('Fetch Units Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, status } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        description,
        status: status ?? true
      }
    });

    return NextResponse.json(unit);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Unit name already exists' }, { status: 400 });
    }
    console.error('Create Unit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
