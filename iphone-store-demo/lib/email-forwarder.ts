import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './mail';

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ForwardEmailConfig {
  id: string;
  source_email: string;
  forward_to_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active email forwarding configurations for a source email
 */
export const getForwardingRules = async (
  sourceEmail: string
): Promise<ForwardEmailConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('forward_email')
      .select('*')
      .eq('source_email', sourceEmail)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching forwarding rules:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception while fetching forwarding rules:', error);
    return [];
  }
};

/**
 * Send an email to the source and forward it to all configured recipients
 */
export const sendAndForwardEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{
  success: boolean;
  primarySent: boolean;
  forwardedTo: string[];
  errors?: string[];
}> => {
  const errors: string[] = [];
  const forwardedTo: string[] = [];

  // Send to the primary recipient
  const primaryResult = await sendEmail({ to, subject, html });
  const primarySent = primaryResult.success;

  if (!primarySent) {
    errors.push(`Failed to send to primary recipient: ${to}`);
  }

  // Fetch forwarding rules for the primary recipient
  const forwardingRules = await getForwardingRules(to);

  // Send to all forwarded recipients
  for (const rule of forwardingRules) {
    try {
      const forwardResult = await sendEmail({
        to: rule.forward_to_email,
        subject: `[Forwarded] ${subject}`,
        html: `
          <div style="background: #e5e5ea; padding: 10px; margin-bottom: 20px; border-left: 4px solid #0071e3;">
            <p style="margin: 0; font-size: 12px; color: #666;">
              <strong>This is a forwarded email from:</strong> ${to}
            </p>
          </div>
          ${html}
        `,
      });

      if (forwardResult.success) {
        forwardedTo.push(rule.forward_to_email);
      } else {
        errors.push(
          `Failed to forward to ${rule.forward_to_email}: ${forwardResult.error}`
        );
      }
    } catch (error) {
      errors.push(`Exception forwarding to ${rule.forward_to_email}: ${error}`);
    }
  }

  return {
    success: primarySent || forwardedTo.length > 0,
    primarySent,
    forwardedTo,
    ...(errors.length > 0 && { errors }),
  };
};

/**
 * Add a new email forwarding rule
 */
export const addForwardingRule = async (
  sourceEmail: string,
  forwardToEmail: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('forward_email').insert([
      {
        source_email: sourceEmail,
        forward_to_email: forwardToEmail,
        is_active: true,
      },
    ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

/**
 * Toggle a forwarding rule's active status
 */
export const toggleForwardingRule = async (
  ruleId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('forward_email')
      .update({ is_active: isActive })
      .eq('id', ruleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};

/**
 * Delete a forwarding rule
 */
export const deleteForwardingRule = async (
  ruleId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('forward_email')
      .delete()
      .eq('id', ruleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
};
