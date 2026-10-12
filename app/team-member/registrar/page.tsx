"use client";

import BiometricRegistrationView from "@/components/attendance/BiometricRegistrationView";

export default function RegisterAttendancePage() {
  return (
    <BiometricRegistrationView
      allowedRoles={["TEAM_MEMBER"]}
      previewRoute="/team-member/registrar/prev"
      vacationsRoute="/team-member/vacaciones"
      homeRoute="/team-member"
    />
  );
}
