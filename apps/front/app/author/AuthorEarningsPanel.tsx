"use client";

export interface BookData {
  ebookid: number;
  category: string;
  title: string;
  cover: string | null;
  token_per_book: number;
  price_baht: number;
  sold_count: number;
  total_tokens_earned: number;
  total_baht_earned: number;
}

export interface EarningsData {
  author: {
    userid?: number;
    fullname: string;
    username: string;
    email: string;
    role?: string;
  };
  summary: {
    current_token_balance: number;
    current_balance_baht: number;
    total_tokens_earned: number;
    total_baht_earned: number;
    total_books: number;
    total_sales: number;
  };
  top_selling_books: BookData[];
  all_books: BookData[];
}

export function AuthorEarningsPanel({
  data,
  showAllBooks,
  onToggleShowAllBooks,
}: {
  data: EarningsData;
  showAllBooks: boolean;
  onToggleShowAllBooks: () => void;
}) {
  const displayBooks = showAllBooks ? data.all_books : data.top_selling_books;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">โทเค็นคงเหลือ</p>
          <p className="text-3xl font-bold">
            {data.summary.current_token_balance}
          </p>
          <p className="text-sm text-blue-600">
            {data.summary.current_balance_baht.toLocaleString()} บาท
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">รายรับรวม</p>
          <p className="text-3xl font-bold">
            {data.summary.total_baht_earned.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            {data.summary.total_tokens_earned} โทเค็น
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">จำนวนหนังสือ</p>
          <p className="text-3xl font-bold">{data.summary.total_books}</p>
          <p className="text-sm text-gray-500">เล่ม</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">ยอดขายรวม</p>
          <p className="text-3xl font-bold">{data.summary.total_sales}</p>
          <p className="text-sm text-gray-500">ครั้ง</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between">
          <h2 className="text-lg font-semibold">
            {showAllBooks ? "หนังสือทั้งหมด" : "หนังสือขายดี 10 อันดับแรก"}
          </h2>
          <button
            type="button"
            onClick={onToggleShowAllBooks}
            className="text-blue-600 text-sm"
          >
            {showAllBooks ? "แสดง 10 อันดับแรก" : "ดูทั้งหมด"}
          </button>
        </div>

        {displayBooks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">ยังไม่มีหนังสือ</p>
            <p className="text-xs text-gray-400 mt-2">
              นักเขียน {data.author.fullname} ยังไม่มีหนังสือในระบบ
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs">ลำดับ</th>
                  <th className="px-6 py-3 text-left text-xs">หนังสือ</th>
                  <th className="px-6 py-3 text-center text-xs">ราคา</th>
                  <th className="px-6 py-3 text-center text-xs">ยอดขาย</th>
                  <th className="px-6 py-3 text-right text-xs">รายรับ</th>
                </tr>
              </thead>
              <tbody>
                {displayBooks.map((book, index) => (
                  <tr key={book.ebookid} className="border-t">
                    <td className="px-6 py-4 text-sm">{index + 1}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-gray-500">ID: {book.ebookid}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {book.token_per_book} โทเค็น
                      <br />
                      <span className="text-xs text-blue-600">
                        {book.price_baht.toLocaleString()} บาท
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {book.sold_count} ครั้ง
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold">
                        {book.total_baht_earned.toLocaleString()} บาท
                      </p>
                      <p className="text-xs text-gray-400">
                        {book.total_tokens_earned} โทเค็น
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
