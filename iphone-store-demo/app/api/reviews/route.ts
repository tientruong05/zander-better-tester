import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('product_id');

  if (!productId) {
    return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { product_id, reviewer_name, rating, comment } = body;

  if (!product_id || !reviewer_name || !rating) {
    return NextResponse.json({ error: 'product_id, reviewer_name, and rating are required' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
  }

  const trimmedName = reviewer_name.trim();
  if (trimmedName.length === 0 || trimmedName.length > 100) {
    return NextResponse.json({ error: 'reviewer_name must be 1-100 characters' }, { status: 400 });
  }

  const trimmedComment = comment?.trim() || null;
  if (trimmedComment && trimmedComment.length > 1000) {
    return NextResponse.json({ error: 'comment must be under 1000 characters' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      product_id,
      reviewer_name: trimmedName,
      rating: Math.round(rating),
      comment: trimmedComment,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
