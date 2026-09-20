import { useCallback, useEffect, useRef, useState } from "react";
import {
  changeCurrentPassword,
  getCurrentAccount,
  getCurrentProfessionalProfile,
  verifyCurrentPassword,
} from "../services/accountService";

export function useAccount(user) {
  const requestId = useRef(0);
  const submittingRef = useRef(false);
  const [state, setState] = useState({
    account: null,
    profile: null,
    isAccountLoading: true,
    isProfileLoading: user?.role === "professional",
    accountError: null,
    profileError: null,
    isUpdatingPassword: false,
    passwordUpdated: false,
  });

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((current) => ({
      ...current,
      isAccountLoading: true,
      isProfileLoading: user?.role === "professional",
      accountError: null,
      profileError: null,
    }));

    try {
      const account = await getCurrentAccount(user?.id);
      if (id !== requestId.current) return;
      setState((current) => ({ ...current, account, isAccountLoading: false }));
    } catch (accountError) {
      if (id !== requestId.current || accountError?.isAbort) return;
      setState((current) => ({ ...current, accountError, isAccountLoading: false, isProfileLoading: false }));
      return;
    }

    if (user?.role !== "professional") return;
    try {
      const profile = await getCurrentProfessionalProfile(user.id);
      if (id !== requestId.current) return;
      setState((current) => ({ ...current, profile, isProfileLoading: false }));
    } catch (profileError) {
      if (id !== requestId.current || profileError?.isAbort) return;
      setState((current) => ({ ...current, profileError, isProfileLoading: false }));
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  const updatePassword = useCallback(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setState((current) => ({ ...current, isUpdatingPassword: true, passwordUpdated: false }));
    try {
      await verifyCurrentPassword(user, values.currentPassword);
      await changeCurrentPassword(
        user.id,
        values.currentPassword,
        values.newPassword,
        values.passwordConfirmation,
      );
      setState((current) => ({ ...current, passwordUpdated: true }));
    } finally {
      submittingRef.current = false;
      setState((current) => ({ ...current, isUpdatingPassword: false }));
    }
  }, [user]);

  return { ...state, retry: load, updatePassword };
}
