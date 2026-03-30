"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, fetchJson, getCookie, UserProfile } from "../../lib/account";

interface PaymentSearchResult {
  id: number;
  username: string;
  paymenttype: string;
  tokenpaid: number;
  transdate: string;
  status: string;
}

export default function SearchPaymentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState<PaymentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
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
        setAccessReady(true);
      }
    };

    void loadProfile();
  }, [router]);

  const handleSearch = async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        username,
        date,
      }).toString();

      const res = await fetch(`http://localhost:8000/app/payments/search/?${query}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ค้นหาไม่สำเร็จ");
      }

      setResults(data as PaymentSearchResult[]);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  if (!accessReady) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16 text-gray-700">
        Loading...
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Admin only</h1>
          <p className="mt-3 text-sm text-gray-600">
            You need an admin account to search payment records.
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Back
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
              ค้นหาประวัติการชำระเงิน
            </h1>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-600 hover:shadow-md active:scale-95"
            >
              ย้อนกลับ
            </Link>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            <input
              type="date"
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />

            <button
              type="button"
              onClick={() => void handleSearch()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              ค้นหา
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
        </div>

        {loading && (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">กำลังค้นหา...</p>
          </div>
        )}

        {!loading && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">ID</th>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-center">Token</th>
                  <th className="px-6 py-3 text-center">Date</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>

              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  results.map((item) => (
                    <tr key={item.id} className="border-t text-sm">
                      <td className="px-6 py-4">{item.id}</td>
                      <td className="px-6 py-4">{item.username}</td>
                      <td className="px-6 py-4">{item.paymenttype}</td>
                      <td className="px-6 py-4 text-center font-semibold">
                        {item.tokenpaid} Tk
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.transdate?.slice(0, 10)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.status === "wait"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
