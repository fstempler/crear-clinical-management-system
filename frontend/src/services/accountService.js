import { pb } from "../lib/pocketbase";

export async function getCurrentAccount(userId) {
  if (!userId) throw new Error("missing-user");
  const account = await pb.collection("staff_users").getOne(userId, { requestKey: null });
  if (account.id !== userId) {
    const error = new Error("account-mismatch");
    error.code = "session_invalid";
    throw error;
  }
  return account;
}

export async function getCurrentProfessionalProfile(userId) {
  if (!userId) return null;
  try {
    return await pb.collection("professionals").getFirstListItem(
      pb.filter("staff_user = {:userId}", { userId }),
      { requestKey: null },
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function verifyCurrentPassword(user, currentPassword) {
  const authData = await pb.collection("staff_users").authWithPassword(
    user.email,
    currentPassword,
    { requestKey: null },
  );

  if (authData.record?.id !== user.id) {
    pb.authStore.clear();
    const error = new Error("authenticated-account-mismatch");
    error.code = "session_invalid";
    throw error;
  }

  return authData.record;
}

export function changeCurrentPassword(
  userId,
  currentPassword,
  newPassword,
  passwordConfirmation,
) {
  return pb.collection("staff_users").update(
    userId,
    {
      oldPassword: currentPassword,
      password: newPassword,
      passwordConfirm: passwordConfirmation,
    },
    { requestKey: null },
  );
}

export function isSessionError(error) {
  return error?.code === "session_invalid" || error?.status === 401 || error?.status === 403;
}

export function isConnectionError(error) {
  return error?.status === 0 || /network|fetch|connection/i.test(error?.message || "");
}

export function isWrongPasswordError(error) {
  if (error?.status !== 400) return false;
  const details = JSON.stringify(error?.response || error?.data || {});
  return /identity|password|credentials|auth/i.test(details);
}
