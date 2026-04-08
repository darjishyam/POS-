import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRole } from '@/lib/roles';

const ALLOWED_NEXT_STATUSES = new Set(['APPROVED', 'COMPLETED', 'CANCELLED']);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status: nextStatus } = body as { status?: string };

    if (!nextStatus || !ALLOWED_NEXT_STATUSES.has(nextStatus)) {
      return NextResponse.json(
        { error: 'Invalid status transition request' },
        { status: 400 }
      );
    }

    const role = await getRole();
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    const currentStatus = transfer.status;

    // Validate transitions
    if (currentStatus === 'COMPLETED') {
      return NextResponse.json({ error: 'Transfer already completed' }, { status: 400 });
    }

    if (nextStatus === 'APPROVED' && currentStatus !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only PENDING transfers can be approved' },
        { status: 400 }
      );
    }

    if (nextStatus === 'COMPLETED' && currentStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only APPROVED transfers can be completed' },
        { status: 400 }
      );
    }

    if (nextStatus === 'CANCELLED' && !['PENDING', 'APPROVED'].includes(currentStatus)) {
      return NextResponse.json(
        { error: 'Only PENDING/APPROVED transfers can be cancelled' },
        { status: 400 }
      );
    }

    // Simple status update branches
    if (nextStatus === 'APPROVED') {
      const updated = await prisma.stockTransfer.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: { fromLocation: true, toLocation: true, _count: { select: { items: true } } },
      });
      return NextResponse.json(updated);
    }

    if (nextStatus === 'CANCELLED') {
      const updated = await prisma.stockTransfer.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { fromLocation: true, toLocation: true, _count: { select: { items: true } } },
      });
      return NextResponse.json(updated);
    }

    // Execute branch: APPROVED -> COMPLETED
    if (nextStatus === 'COMPLETED') {
      const items = transfer.items;
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'Transfer has no items' }, { status: 400 });
      }

      const productIds = items.map((i) => i.productId);
      const fromStocks = await prisma.locationStock.findMany({
        where: {
          locationId: transfer.fromLocationId,
          productId: { in: productIds },
        },
      });

      const fromQtyByProduct = new Map(fromStocks.map((s) => [s.productId, s.quantity]));

      // Validate availability first (prevents negative quantities)
      for (const item of items) {
        const available = fromQtyByProduct.get(item.productId) ?? 0;
        if (available < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock at origin for product ${item.productId}`,
              available,
              required: item.quantity,
            },
            { status: 400 }
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const item of items) {
          // Decrement origin location stock (must exist and be sufficient)
          await tx.locationStock.update({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: transfer.fromLocationId,
              },
            },
            data: { quantity: { decrement: item.quantity } },
          });

          // Increment destination location stock
          await tx.locationStock.upsert({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: transfer.toLocationId,
              },
            },
            update: { quantity: { increment: item.quantity } },
            create: {
              productId: item.productId,
              locationId: transfer.toLocationId,
              quantity: item.quantity,
            },
          });
        }

        await tx.stockTransfer.update({
          where: { id: transfer.id },
          data: { status: 'COMPLETED' },
        });
      });

      const updated = await prisma.stockTransfer.findUnique({
        where: { id },
        include: { fromLocation: true, toLocation: true, _count: { select: { items: true } } },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Unhandled transition' }, { status: 400 });
  } catch (error) {
    console.error('Stock transfer status PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update transfer status' },
      { status: 500 }
    );
  }
}

