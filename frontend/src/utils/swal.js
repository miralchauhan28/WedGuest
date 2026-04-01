import Swal from "sweetalert2";

const colors = {
  confirmButtonColor: "#2f3068",
  cancelButtonColor: "#6b7280",
};

export async function confirmLogout() {
  const result = await Swal.fire({
    title: "Log out?",
    text: "You will need to sign in again to access your account.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, log out",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    ...colors,
  });
  return result.isConfirmed;
}

export async function confirmDeleteWedding(coupleName) {
  const result = await Swal.fire({
    title: "Delete this wedding?",
    html: `This will permanently remove <strong>${escapeHtml(coupleName)}</strong> and <strong>all guests</strong> for this event.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    ...colors,
  });
  return result.isConfirmed;
}

export async function confirmDeleteGuest(name) {
  const result = await Swal.fire({
    title: "Remove this guest?",
    text: `Remove ${name} from the guest list?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    ...colors,
  });
  return result.isConfirmed;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function showSuccess(message) {
  return Swal.fire({
    icon: "success",
    title: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3200,
    timerProgressBar: true,
  });
}

export function showError(message) {
  return Swal.fire({
    icon: "error",
    title: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
}
