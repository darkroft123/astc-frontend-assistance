import { useState, useEffect } from "react";
import { useAuth } from "@/app/jwt/auth/auth.provider";
import { getGraphQLUrl } from "@/lib/api-host";

const GET_DASHBOARD = `
  query getDashboard($fromDate: String, $toDate: String) {
    getDashboard(fromDate: $fromDate, toDate: $toDate) {
      totalAttendances
      totalAbsences
      pendingJustifications
    }
  }
`;

export function useDashboardAsistencia({
  fromDate,
  toDate,
}: {
  fromDate: string;
  toDate: string;
}) {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState({
    totalAttendances: 0,
    totalAbsences: 0,
    pendingJustifications: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(getGraphQLUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            query: GET_DASHBOARD,
            variables: { fromDate, toDate },
          }),
        });

        const json = await res.json();
        const data = json?.data?.getDashboard || {};

        setMetrics({
          totalAttendances: Number(data.totalAttendances) || 0,
          totalAbsences: Number(data.totalAbsences) || 0,
          pendingJustifications: Number(data.pendingJustifications) || 0,
        });
      } catch (err) {
        console.error("Error dashboard asistencia:", err);
        setError("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }

    if (fromDate && toDate) fetchData();
  }, [fromDate, toDate, token]);

  return { metrics, loading, error };
}
