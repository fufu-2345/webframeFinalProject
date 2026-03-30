"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, fetchJson, getCookie, UserProfile } from "../lib/account";

export default function AdminHomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userid = getCookie("userid");

    if (!userid) {
      router.replace("/login");
      return;
    }

    const loadProfile = async () => {
      try {
        const profileData = await fetchJson<UserProfile>(`${API_URL}/users/me/`);
        setProfile(profileData);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700">
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-rose-700">
        {error}
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Admin only</h1>
          <p className="mt-3 text-sm text-slate-600">
            This page is available only for admin users.
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg text-center ">

        <h1 className="mt-2 text-2xl font-semibold text-slate-900 ">
          Admin Menu
        </h1>


        <div className="mt-6 grid grid-cols-1 gap-4">
                <Link
            href="/menu"
            className="rounded-xl border py-3 text-slate-700 font-medium hover:bg-slate-100 transition"
          >
           Back to Menu
          </Link>
          <Link
            href="/admin/payments"
            className="rounded-xl border py-3 text-slate-700 font-medium hover:bg-slate-100 transition"
          >
            Payment Approval
          </Link>

          <Link
            href="/search"
            className="rounded-xl border py-3 text-slate-700 font-medium hover:bg-slate-100 transition"
          >
            Search Records
          </Link>

    
        </div>
      </div>
    </main>
  );
}