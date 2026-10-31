import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  getForwardingRules,
  addForwardingRule,
  toggleForwardingRule,
  deleteForwardingRule,
} from '@/lib/email-forwarder';

/**
 * GET /api/admin/email-forwarding
 * Fetch all forwarding rules (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and check if user is admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all forwarding rules
    const { data: rules, error: fetchError } = await supabaseAdmin
      .from('forward_email')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch forwarding rules' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error('Error fetching forwarding rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email-forwarding
 * Add a new forwarding rule (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and check if user is admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sourceEmail, forwardToEmail } = body;

    if (!sourceEmail || !forwardToEmail) {
      return NextResponse.json(
        { error: 'sourceEmail and forwardToEmail are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sourceEmail) || !emailRegex.test(forwardToEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await addForwardingRule(sourceEmail, forwardToEmail);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add forwarding rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Forwarding rule added successfully',
    });
  } catch (error) {
    console.error('Error adding forwarding rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/email-forwarding/[id]
 * Toggle a forwarding rule's active status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and check if user is admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'id and isActive are required' },
        { status: 400 }
      );
    }

    const result = await toggleForwardingRule(id, isActive);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to toggle forwarding rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Forwarding rule updated successfully',
    });
  } catch (error) {
    console.error('Error toggling forwarding rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/email-forwarding/[id]
 * Delete a forwarding rule (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify token and check if user is admin
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const result = await deleteForwardingRule(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete forwarding rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Forwarding rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting forwarding rule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
