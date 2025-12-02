import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { block_type: string } }
) {
  try {
    const { block_type } = params;
    const block_type_int = parseInt(block_type);

    const blockData = await prisma.block_data.findUnique({
      where: {
        block_type: block_type_int
      }
    });

    if (!blockData) {
      return NextResponse.json({ error: 'Block data not found' }, { status: 404 });
    }

    return NextResponse.json(blockData);
  } catch (error) {
    console.error('Error fetching block data:', error);
    return NextResponse.json({ error: 'Failed to fetch block data' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { block_type: string } }
) {
  try {
    const { block_type } = params;
    const block_type_int = parseInt(block_type);
    const body = await request.json();
    const { block_name, header_cell_type, body_cell_type, init_row, init_col, col_editable, group_name, color } = body;

    if (!block_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const blockData = await prisma.block_data.upsert({
      where: {
        block_type: block_type_int
      },
      update: {
        block_name,
        header_cell_type: header_cell_type || {},
        body_cell_type: body_cell_type || {},
        init_row: init_row || 1,
        init_col: init_col || 1,
        col_editable: col_editable !== undefined ? col_editable : true,
        group_name: group_name || null,
        color: color || null
      },
      create: {
        block_type: block_type_int,
        block_name,
        header_cell_type: header_cell_type || {},
        body_cell_type: body_cell_type || {},
        init_row: init_row || 1,
        init_col: init_col || 1,
        col_editable: col_editable !== undefined ? col_editable : true,
        group_name: group_name || null,
        color: color || null
      }
    });

    return NextResponse.json(blockData);
  } catch (error) {
    console.error('Error updating block data:', error);
    return NextResponse.json({ error: 'Failed to update block data' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { block_type: string } }
) {
  try {
    const { block_type } = params;
    const block_type_int = parseInt(block_type);

    await prisma.block_data.delete({
      where: {
        block_type: block_type_int
      }
    });

    return NextResponse.json({ message: 'Block data deleted successfully' });
  } catch (error) {
    console.error('Error deleting block data:', error);
    return NextResponse.json({ error: 'Failed to delete block data' }, { status: 500 });
  }
}