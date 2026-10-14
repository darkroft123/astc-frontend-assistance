"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "./auth.provider";
import { getApiBaseUrl } from "@/lib/api-host";

export function useAuthGuard(allowedRoles: string[]) {
  const { token, user, role, hydrated, logout } = useAuth();
  const rolesKey = allowedRoles.join(",");

  const [checking, setChecking] = useState(false);
  const checkedRef = useRef(true);

  useEffect(() => {
    // [MOCK LOCAL] Bypass de autenticacion sin backend para desarrollo rapido
    // Codigo original comentado para restauracion posterior:
    /*
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
    */
  }, [hydrated, token, user, role, rolesKey]);

  // [MOCK LOCAL] Devuelve usuario colaborador mock siempre autenticado
  const mockToken = "mock_jwt_token_local_user_12345";
  const mockUser = {
    id: "user-002",
    sub: "user-002",
    email: "colaborador@astc.joyit.io",
    username: "colaborador-carlos",
    firstName: "Carlos",
    lastName: "Mamani",
    role: "USER",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  };

  return {
    hydrated: true,
    token: token || mockToken,
    user: user || (mockUser as any),
    role: role || "USER",
    checkingAuth: false,
  };
}
