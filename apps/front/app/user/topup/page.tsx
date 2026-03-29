"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PaymentStatusList } from "../../components/payment-status-list";
import {
  API_URL,
  fetchJson,
  formatDateTime,
  formatRole,
  getCookie,
  PaymentItem,
  UserProfile,
} from "../../lib/account";

type Mode = "topup" | "subscription";

export default function TopupPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [mode, setMode] = useState<Mode>("topup");
  const [tokenAmount, setTokenAmount] = useState("1");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState("");
  const isLoggedIn = Boolean(getCookie("userid"));

  const loadData = async () => {
    setLoading(true);

    try {
      const [profileData, paymentData] = await Promise.all([
        fetchJson<UserProfile>(`${API_URL}/users/me/`),
        fetchJson<PaymentItem[]>(`${API_URL}/users/payments/`),
      ]);

      document.cookie = `role=${profileData.role}; path=/; max-age=604800`;
      setProfile(profileData);
      setPayments(paymentData);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    loadData();
  }, [isLoggedIn, router]);

  const tokenValue = useMemo(() => {
    const parsed = Number(tokenAmount);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }

    return Math.floor(parsed);
  }, [tokenAmount]);

  const tokenPrice = tokenValue * 50;

  const handleTopup = async () => {
    if (tokenValue <= 0) {
      setError("กรุณากรอกจำนวนโทเคน");
      return;
    }

    setSubmitting("topup");

    try {
      await fetchJson<{ message: string }>(`${API_URL}/user/topup/request/`, {
        method: "POST",
        body: JSON.stringify({ token_amount: tokenValue }),
      });

      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setSubmitting("");
    }
  };

  const handleSubscription = async () => {
    setSubmitting("subscription");

    try {
      await fetchJson<{ message: string }>(`${API_URL}/author/subscription/request/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "ส่งคำขอไม่สำเร็จ");
    } finally {
      setSubmitting("");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-700">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-700">Redirecting...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-3">
            <div className="text-xl font-semibold">{profile?.fullname}</div>
            <div className="text-sm text-slate-600">Role: {formatRole(profile?.role)}</div>
            <div className="text-lg font-medium">Token: {profile?.token_balance ?? 0}</div>
            <div className="text-sm text-slate-600">หมดอายุ: {formatDateTime(profile?.author_expire_at)}</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as Mode)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="topup">เติมโทเคน</option>
              <option value="subscription">สมัครสมาชิก</option>
            </select>

            {mode === "topup" ? (
              <div className="space-y-4">
                <div className="text-base font-medium">เติมโทเคน</div>
                <input
                  type="number"
                  min={1}
                  value={tokenAmount}
                  onChange={(event) => setTokenAmount(event.target.value)}
                  placeholder="จำนวนโทเคน"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <input
                  value={tokenPrice > 0 ? `${tokenPrice} บาท` : "-"}
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
                <button
                  onClick={handleTopup}
                  disabled={submitting === "topup"}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submitting === "topup" ? "กำลังบันทึก..." : "ยืนยันการเติม"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-base font-medium">สมัครสมาชิก</div>
                <input
                  value="1999 บาท"
                  readOnly
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                />
                <button
                  onClick={handleSubscription}
                  disabled={submitting === "subscription"}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {submitting === "subscription" ? "กำลังบันทึก..." : "สมัครสมาชิก"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 text-base font-medium">สถานะ</div>
          {error && <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          <PaymentStatusList items={payments.slice(0, 6)} emptyText="ไม่มีรายการ" />
        </section>
      </div>
    </main>
  );
}
