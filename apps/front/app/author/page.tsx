"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, fetchJson, getCookie, UserProfile } from "../lib/account";
import { AuthorEarningsPanel, EarningsData } from "./AuthorEarningsPanel";

type BookItem = {
  title: string;
  total_sales: number;
};

type ActiveTab = "books" | "earnings";

export default function AuthorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("books");
  const [showAllBooks, setShowAllBooks] = useState(false);

  useEffect(() => {
    const userid = getCookie("userid");

    if (!userid) {
      router.replace("/login");
      return;
    }

    const loadAuthorData = async () => {
      try {
        const profileData = await fetchJson<UserProfile>(`${API_URL}/users/me/`);
        setProfile(profileData);
        document.cookie = `role=${profileData.role}; path=/; max-age=604800`;

        if (profileData.role !== "author") {
          setLoading(false);
          return;
        }

        const [booksData, earningsStats] = await Promise.all([
          fetchJson<BookItem[]>(`${API_URL}/report/top-ebooks-author/`),
          fetchJson<EarningsData>(
            `${API_URL}/author/earnings/stats/?user_id=${profileData.userid}`,
          ),
        ]);

        setBooks(booksData);
        setEarningsData(earningsStats);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load author dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAuthorData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-700">
        Loading author dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 px-6 py-16 text-rose-700">
        {error}
      </div>
    );
  }

  if (profile?.role !== "author") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Author only</h1>
          <p className="mt-3 text-sm text-slate-600">
            This page is available only for accounts with the author role.
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
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase text-slate-500">
                Author Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                  {profile.fullname}
              </h1>
            </div>

            <div className="flex gap-3">
              <Link
                href="/menu"
                className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Menu
              </Link>

              <Link
                href="/author/subscription"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              >
                Topup & Billing
              </Link>
            </div>
          </div>
        </section>
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Earnings</h2>

            {!earningsData ? (
              <div className="mt-4 text-sm text-slate-400">
                No earnings data yet.
              </div>
            ) : (
              <div className="mt-4">
                <AuthorEarningsPanel
                  data={earningsData}
                  showAllBooks={showAllBooks}
                  onToggleShowAllBooks={() =>
                    setShowAllBooks((current) => !current)
                  }
                />
              </div>
            )}
          </section>

      </div>
    </main>
  );
}
