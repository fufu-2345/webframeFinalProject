"use client";

export const API_URL = "http://localhost:8000/app";

export type UserProfile = {
  userid: number;
  fullname: string;
  role: string;
  token_balance: number;
  is_author_active: boolean;
  author_expire_at: string | null;
};

export type TopupPlan = {
  id: number;
  name: string;
  price: number;
  token: number;
  is_active: boolean;
};

export type PaymentItem = {
  id: number;
  user_id: number;
  paymenttype: "subscription" | "topup";
  subprice: number;
  tokenpaid: number;
  transdate: string;
  enddate: string | null;
  status: "wait" | "received" | "rejected";
};

export function getCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop()?.split(";").shift() ?? "" : "";
}

async function ensureCsrfToken() {
  let token = getCookie("csrftoken");

  if (token) {
    return token;
  }

  const response = await fetch(`${API_URL}/csrf/`, {
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));

  token = getCookie("csrftoken") || data.csrfToken || "";
  return token;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() || "GET";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await ensureCsrfToken();

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }

  return data as T;
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRole(role?: string) {
  if (role === "admin") return "Admin";
  if (role === "author") return "Author";
  return "User";
}

export function paymentTypeLabel(type: string) {
  return type === "subscription" ? "สมัครสมาชิก Author" : "เติมโทเคน";
}

export function paymentStatusLabel(status: string) {
  if (status === "received") return "อนุมัติแล้ว";
  if (status === "rejected") return "ไม่อนุมัติ";
  return "รอ admin";
}
