import { NextResponse } from "next/server";
import {
  MOCK_USER,
  MOCK_PROJECTS,
  MOCK_TODAY_ATTENDANCE,
  MOCK_DASHBOARD_USER,
  MOCK_ATTENDANCES_LIST,
  MOCK_JUSTIFICATIONS_LIST,
  MOCK_VACATIONS_LIST,
  MOCK_SCHEDULE,
} from "@/lib/mock-data";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body.query || "";

    console.log("[MOCK GRAPHQL ASSISTANCE] Processing query:", query.slice(0, 60).replace(/\s+/g, " "));

    // 1. Dashboard
    if (query.includes("getDashboard")) {
      return NextResponse.json({
        data: {
          getDashboard: MOCK_DASHBOARD_USER,
        },
      });
    }

    // 2. Projects
    if (query.includes("getMyProjects") || query.includes("listProjects")) {
      return NextResponse.json({
        data: {
          getMyProjects: MOCK_PROJECTS,
        },
      });
    }

    // 3. Attendances
    if (query.includes("getTodayAttendance")) {
      return NextResponse.json({
        data: {
          getTodayAttendance: MOCK_TODAY_ATTENDANCE,
        },
      });
    }

    if (query.includes("listAttendance")) {
      return NextResponse.json({
        data: {
          listAttendance: {
            items: MOCK_ATTENDANCES_LIST,
            page: 1,
            size: 20,
            total: MOCK_ATTENDANCES_LIST.length,
          },
        },
      });
    }

    if (query.includes("registerAttendance")) {
      return NextResponse.json({
        data: {
          registerAttendance: {
            id: `att-mock-${Date.now()}`,
            userId: MOCK_USER.id,
            date: new Date().toISOString().split("T")[0],
            checkIn: new Date().toLocaleTimeString("es-PE"),
            status: "ASISTENCIA",
          },
        },
      });
    }

    if (query.includes("checkOut")) {
      return NextResponse.json({
        data: {
          checkOut: {
            id: `att-mock-${Date.now()}`,
            checkOut: new Date().toLocaleTimeString("es-PE"),
            status: "ASISTENCIA",
          },
        },
      });
    }

    // 4. Justifications
    if (query.includes("listJustifications")) {
      return NextResponse.json({
        data: {
          listJustifications: {
            items: MOCK_JUSTIFICATIONS_LIST,
            page: 1,
            size: 20,
            total: MOCK_JUSTIFICATIONS_LIST.length,
          },
        },
      });
    }

    // 5. Vacations & Schedule
    if (query.includes("listMyVacations") || query.includes("listVacations")) {
      return NextResponse.json({
        data: {
          listMyVacations: MOCK_VACATIONS_LIST,
        },
      });
    }

    if (query.includes("getEffectiveSchedule")) {
      return NextResponse.json({
        data: {
          getEffectiveSchedule: MOCK_SCHEDULE,
        },
      });
    }

    return NextResponse.json({
      data: {
        success: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { errors: [{ message: err.message || "Error in Mock GraphQL Route" }] },
      { status: 500 }
    );
  }
}
