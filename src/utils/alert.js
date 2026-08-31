import Swal from 'sweetalert2';

export const showConfirmDialog = async ({
  title = '¿Estás seguro?',
  text = '',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar',
  icon = 'warning',
  isDestructive = true,
  darkMode = true
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    background: darkMode ? '#171717' : '#FFFFFF',
    color: darkMode ? '#EDEDED' : '#0F172A',
    iconColor: icon === 'warning' ? '#F59E0B' : (icon === 'success' ? '#10B981' : '#EF4444'),
    confirmButtonColor: isDestructive ? '#EF4444' : (darkMode ? '#3ECF8E' : '#3B82F6'),
    cancelButtonColor: darkMode ? '#262626' : '#94A3B8',
    backdrop: 'rgba(0, 0, 0, 0.75)',
    borderRadius: '16px'
  });
};

export const showSuccessAlert = async ({
  title = '¡Operación Exitosa!',
  text = '',
  darkMode = true
}) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    background: darkMode ? '#171717' : '#FFFFFF',
    color: darkMode ? '#EDEDED' : '#0F172A',
    iconColor: '#10B981',
    confirmButtonColor: darkMode ? '#3ECF8E' : '#10B981',
    confirmButtonText: 'Aceptar',
    backdrop: 'rgba(0, 0, 0, 0.75)'
  });
};
