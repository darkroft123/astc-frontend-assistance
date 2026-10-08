"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const search = window.location.search;
    router.replace(`/team-member${search}`);
  }, [router]);

  return null;
}