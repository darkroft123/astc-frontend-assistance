"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "./auth.provider";
import { getApiBaseUrl } from "@/lib/api-host";

export function useAuthGuard(allowedRoles: string[]) {
  const { token, user, role, hydrated, logout } = useAuth();
  const rolesKey = allowedRoles.join(",");

  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || checkedRef.current) return;

    if (!token || !user) {
      checkedRef.current = true;
      setChecking(false);
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    if (user.exp && user.exp < Date.now() / 1000) {
      checkedRef.current = true;
      setChecking(false);
      logout();
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    const currentAllowed = rolesKey.split(",").filter(Boolean);
    if (!role || !currentAllowed.includes(role)) {
      checkedRef.current = true;
      setChecking(false);
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    checkedRef.current = true;
    setChecking(false);
  }, [hydrated, token, user, role]);

  return {
    hydrated,
    token,
    user,
    role,
    checkingAuth: checking,
  };
}
