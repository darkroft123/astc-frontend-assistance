"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "./auth.provider";
import { getApiBaseUrl } from "@/lib/api-host";

// [MOCK LOCAL] Devuelve usuario colaborador mock siempre autenticado
const MOCK_TOKEN = "mock_jwt_token_local_user_12345";
const MOCK_USER = {
  id: "user-002",
  sub: "user-002",
  email: "colaborador@astc.joyit.io",
  username: "colaborador-carlos",
  firstName: "Carlos",
  lastName: "Mamani",
  role: "USER",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  exp: 1893456000,
};

export function useAuthGuard(allowedRoles: string[]) {
  const { token, user, role, hydrated, logout } = useAuth();
  const rolesKey = allowedRoles.join(",");

  const [checking, setChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || checkedRef.current) return;

    if (!token || !user) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    if (user.exp && user.exp < Date.now() / 1000) {
      logout();
      return;
    }

    const currentAllowed = rolesKey.split(",").filter(Boolean);
    if (!role || !currentAllowed.includes(role)) {
      window.location.assign(getApiBaseUrl(3003));
      return;
    }

    checkedRef.current = true;
    setChecking(false);
  }, [hydrated, token, user, role, rolesKey, logout]);

  const activeToken = token || MOCK_TOKEN;
  const activeUser = user || (MOCK_USER as any);
  const activeRole = role || "USER";

  return useMemo(
    () => ({
      hydrated: true,
      token: activeToken,
      user: activeUser,
      role: activeRole,
      checkingAuth: false,
    }),
    [activeToken, activeUser, activeRole]
  );
}
