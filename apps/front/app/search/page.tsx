"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, fetchJson, getCookie, UserProfile } from "../lib/account";

export default function SearchMenu() {
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
        setError(loadError instanceof Error ? loadError.message : "Access denied");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16 text-gray-700">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16 text-rose-700">
        {error}
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Admin only</h1>
          <p className="mt-3 text-sm text-gray-600">
            Search tools are available only for admin accounts.
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <h1 className="text-2xl font-bold text-gray-900">
      Search System
    </h1>
    <Link
      href="/admin"
      className="inline-flex items-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition"
    >
      ย้อนกลับ
    </Link>

  </div>
</div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <Link
            href="/search/payment"
            className="block p-5 rounded-xl border hover:bg-blue-50 transition"
          >
            <p className="text-lg font-semibold text-black-600">
              Search Payment
            </p>
            <p className="text-sm text-gray-500 mt-1">
               ค้นหาประวัติการเติมโทเค็น
            </p>
          </Link>

          <Link
            href="/search/transaccount"
            className="block p-5 rounded-xl border hover:bg-green-50 transition"
          >
            <p className="text-lg font-semibold text-black-600">
              Search TransAccount
            </p>
            <p className="text-sm text-gray-500 mt-1">
              ค้นหาประวัติการใช้โทเค็น
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
}
