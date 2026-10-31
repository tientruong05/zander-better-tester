import Swal from 'sweetalert2';

/**
 * Parse Supabase/PostgreSQL errors into user-friendly Vietnamese messages.
 * Detects duplicate slug (unique_violation 23505) and other common DB errors.
 */
export function parseSupabaseError(error: any, entityName: string): string {
  const code = error?.code;
  const message = error?.message || '';
  const details = error?.details || '';

  // Unique constraint violation (duplicate slug, etc.)
  if (code === '23505') {
    if (message.includes('slug') || details.includes('slug')) {
      return `Slug (đường dẫn URL) đã tồn tại. Vui lòng chọn một slug khác cho ${entityName} này.`;
    }
    if (message.includes('name') || details.includes('name')) {
      return `Tên ${entityName} đã tồn tại. Vui lòng chọn tên khác.`;
    }
    return `${entityName} này đã tồn tại (trùng dữ liệu). Vui lòng kiểm tra lại thông tin.`;
  }

  // Foreign key violation
  if (code === '23503') {
    return `Không thể thực hiện vì ${entityName} đang được liên kết với dữ liệu khác.`;
  }

  // Not null violation
  if (code === '23502') {
    const column = details.match(/column "(.+?)"/)?.[1] || '';
    return `Vui lòng điền đầy đủ thông tin bắt buộc${column ? ` (${column})` : ''}.`;
  }

  return error?.message || 'Đã xảy ra lỗi không xác định';
}

export const notifySuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const notifyError = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
};

export const confirmAction = async (title: string, text: string, confirmButtonText = 'Đồng ý') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#0071e3',
    cancelButtonColor: '#d33',
    confirmButtonText: confirmButtonText,
    cancelButtonText: 'Hủy',
  });
};
