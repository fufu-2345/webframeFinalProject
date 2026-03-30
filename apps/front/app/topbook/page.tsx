"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TopBook = {
  title: string;
  author: string | null;
  total_sales: number;
};

export default function TopBooksPage() {
  const [data, setData] = useState<TopBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const getTopBooks = async () => {
      try {
        const res = await fetch("http://localhost:8000/app/report/top-books/", {
          credentials: "include",
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch top books");
        }

        const result = (await res.json()) as TopBook[];
        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to fetch data",
        );
      } finally {
        setLoading(false);
      }
    };

    void getTopBooks();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-700">Loading top books...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-100 px-6 py-16 text-rose-700">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-2xl font-medium uppercase ">
                Top Books
              </p>
 
            </div>
            <Link
              href="/menu"
              className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Back to menu
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((item, index) => (
            <article
              key={`${item.title}-${index}`}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">#{index + 1}</span>
                {index < 3 && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    TOP {index + 1}
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Author: {item.author || "-"}
              </p>
              <div className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                Sold {item.total_sales} time{item.total_sales === 1 ? "" : "s"}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
