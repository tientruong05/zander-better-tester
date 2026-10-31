
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 84, replace with 0
  if (cleaned.startsWith('84')) {
    return '0' + cleaned.slice(2);
  }
  
  // If it starts with +84, replace with 0
  if (phone.startsWith('+84')) {
     return '0' + phone.slice(3);
  }

  return phone;
}
