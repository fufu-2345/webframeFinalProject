"use client";

import { formatDateTime, PaymentItem, paymentStatusLabel, paymentTypeLabel } from "../lib/account";

export function PaymentStatusList({
  items,
  emptyText,
}: {
  items: PaymentItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 md:flex-row md:items-center md:justify-between"
        >
          <div className="space-y-1">
            <div>{paymentTypeLabel(item.paymenttype)}</div>
            <div>{item.subprice.toLocaleString()} บาท</div>
            <div>{formatDateTime(item.transdate)}</div>
          </div>
          <div className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
            {paymentStatusLabel(item.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
