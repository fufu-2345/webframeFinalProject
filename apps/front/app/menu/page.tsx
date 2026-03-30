"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL, fetchJson, getCookie, UserProfile } from "../lib/account";
import { get } from "http";

interface Ebook {
  ebookid: number;
  title: string;
  cover: string;
  ebooktoken: number;
  author: number;
}

type Notice = {
  type: "success" | "error";
  text: string;
};

const FALLBACK_COVER_URL = "https://via.placeholder.com/300x400?text=No+Cover";

async function loadCurrentProfile() {
  if (!getCookie("userid")) {
    return null;
  }

  try {
    return await fetchJson<UserProfile>(`${API_URL}/users/me/`);
  } catch {
    return null;
  }
}

export default function MenuPage() {
  const router = useRouter();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  //const isLoggedIn = Boolean(getCookie("userid"));
  const [isLoggedIn, setIsLoggedIn] = useState<Boolean>(false);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const ebookData = await fetchJson<Ebook[]>(`${API_URL}/ebooks/list/`);
        setEbooks(ebookData);
      } catch (loadError) {
        setNotice({
          type: "error",
          text:
            loadError instanceof Error
              ? loadError.message
              : "Unable to load ebooks",
        });
      }
      const currentProfile = await loadCurrentProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        setRole(currentProfile.role);
        setIsLoggedIn(getCookie("userid") ? true : false);
        document.cookie = `role=${currentProfile.role}; path=/; max-age=604800`;
      }
    };

    void loadData();
  }, []);

  const handleBuyClick = async (ebook: Ebook) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const currentProfile = profile || (await loadCurrentProfile());

    if (!currentProfile) {
      setNotice({ type: "error", text: "Please login first" });
      return;
    }

    if (currentProfile.token_balance < ebook.ebooktoken) {
      setNotice({
        type: "error",
        text: `You need ${ebook.ebooktoken} tokens to buy this book, but you only have ${currentProfile.token_balance}.`,
      });
      return;
    }

    const isConfirmed = window.confirm(
      `Buy "${ebook.title}" for ${ebook.ebooktoken} tokens?`,
    );

    if (!isConfirmed) {
      return;
    }

    setBuyingId(ebook.ebookid);
    setNotice(null);

    try {
      await fetchJson<{ message: string }>(`${API_URL}/payment/purchase/`, {
        method: "POST",
        body: JSON.stringify({ ebook_id: ebook.ebookid }),
      });

      const freshProfile = await loadCurrentProfile();
      if (freshProfile) {
        setProfile(freshProfile);
      }

      setNotice({
        type: "success",
        text: `You bought "${ebook.title}" successfully.`,
      });
    } catch (buyError) {
      setNotice({
        type: "error",
        text:
          buyError instanceof Error ? buyError.message : "Purchase failed",
      });
    } finally {
      setBuyingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchJson<{ message: string }>(`${API_URL}/logout/`, {
        method: "POST",
      });
    } catch {
      const expiredCookie = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie = `userid=; ${expiredCookie}`;
      document.cookie = `role=; ${expiredCookie}`;
      document.cookie = `sessionid=; ${expiredCookie}`;
      document.cookie = `csrftoken=; ${expiredCookie}`;
    } finally {
      setProfile(null);
      setNotice({
        type: "success",
        text: "You have been logged out.",
      });
    }
  };

  const quickLinks = [
    {
      href: "/topbook",
      title: "Top Books",
      visible: true,
    },
    {
      href: "/history",
      title: "History",
      visible: isLoggedIn && role !== "admin",
    },
    {
      href: "/user/topup",
      title: "Top Up & Subscription",
      visible: isLoggedIn && role === "user",
    },
    {
      href: "/author",
      title: "Author Dashboard",
      visible: isLoggedIn && role === "author",
    },
    {
      href: "/admin",
      title: "Admin Dashboard",
      visible: isLoggedIn && role === "admin",
    },
    {
      href: "/login",
      title: "Login",
      visible: !isLoggedIn,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-3xl font-semibold text-slate-900">Main Menu</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700">
              <span>
                <span className="text-slate-500">Name:</span>{" "}
                <span className="font-semibold">{profile?.fullname || "Guest"}</span>
              </span>

              <span>
                <span className="text-slate-500">Role:</span>{" "}
                {role ? (
                  <span className="font-semibold">{role}</span>
                ) : (
                  <span className="font-semibold">guest</span>
                )}
              </span>

              <span>
                <span className="text-slate-500">Tokens:</span>{" "}
                <span className="font-semibold text-indigo-600">
                  {profile?.token_balance ?? 0}
                </span>
              </span>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-wrap justify-center gap-3">
          {quickLinks
            .filter((item) => item.visible)
            .map((item) => (
              <Link key={item.href} href={item.href}>
                <button className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
                  {item.title}
                </button>
              </Link>
            ))}
        </section>

        {notice && (
          <section
            className={`rounded-2xl px-5 py-4 text-sm shadow-sm ${
              notice.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {notice.text}
          </section>
        )}

        <section>
          {ebooks.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No ebooks found in the system.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {ebooks.map((ebook) => (
                <button
                  key={ebook.ebookid}
                  type="button"
                  onClick={() => void handleBuyClick(ebook)}
                  disabled={buyingId === ebook.ebookid}
                  className="flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white text-left shadow-md transition-shadow duration-300 hover:shadow-xl disabled:cursor-wait"
                >
                  <div className="group relative h-64 overflow-hidden bg-gray-200">
                    {ebook.cover ? (
                      <Image
                        src={`http://localhost:8000${ebook.cover}`}
                        alt={ebook.title}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(event) => {
                          if (event.currentTarget.src !== FALLBACK_COVER_URL) {
                            event.currentTarget.src = FALLBACK_COVER_URL;
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No cover
                      </div>
                    )}
                  </div>

                  <div className="flex flex-grow flex-col justify-between p-5">
                    <div>
                      <h3 className="mb-1 line-clamp-2 text-lg font-bold text-gray-900">
                        {ebook.title}
                      </h3>
                      <p className="mb-3 text-sm text-gray-500">
                        Book ID: #{ebook.ebookid}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-indigo-600">
                        {ebook.ebooktoken}{" "}
                        <span className="text-sm text-indigo-400">Tokens</span>
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                      {buyingId === ebook.ebookid
                        ? "Processing purchase..."
                        : "Click to buy"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
