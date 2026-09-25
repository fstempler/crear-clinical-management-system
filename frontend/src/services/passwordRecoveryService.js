import { pb } from "../lib/pocketbase";

export function requestPasswordReset(email) {
  return pb.collection("staff_users").requestPasswordReset(email, { requestKey: null });
}

export function confirmPasswordReset(token, password, passwordConfirm) {
  return pb.collection("staff_users").confirmPasswordReset(token, password, passwordConfirm, { requestKey: null });
}

export function isRecoveryConnectionError(error) {
  return error?.status === 0 || /network|failed to fetch|connection/i.test(error?.message || "");
}

export function isRecoveryUnavailable(error) {
  return error?.status === 429 || (error?.status >= 500 && error?.status < 600);
}
