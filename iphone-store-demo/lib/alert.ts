import Swal from 'sweetalert2';

export const showAlert = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonColor: '#0071e3',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  },
  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#0071e3',
    });
  },
  info: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'info',
      title,
      text,
      confirmButtonColor: '#0071e3',
    });
  },
  warning: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonColor: '#0071e3',
    });
  },
  confirm: (title: string, text: string, confirmButtonText = 'Đồng ý') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0071e3',
      cancelButtonColor: '#71717a',
      confirmButtonText,
      cancelButtonText: 'Hủy',
    });
  },
};
