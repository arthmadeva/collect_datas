import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

interface KonfirmasiBeli {
  konfirmasi_id: number;
  verifikasi_id: number;
  created_at: string;
  beli: boolean;
  resep: string;
  nomor_sp: string;
  alamat_kirim: string;
  tanggal_kirim_frame: string;
  tanggal_kirim_lensa: string;
  cek_mutasi: boolean;
  id_form: string;
  verifikasi_kartu: {
    collect_data: {
      nama: string;
      nomor_kartu: string;
      cabang: string;
    };
  };
  aktual?: { aktual_id: number }[];
  bayar_silang?: { silang_id: number }[];
}

interface KeuanganDashboardProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialTodoAktual: KonfirmasiBeli[];
  initialTodoBayarSilang: KonfirmasiBeli[];
}

export default function KeuanganDashboard({
  user,
  initialTodoAktual,
  initialTodoBayarSilang,
}: KeuanganDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [todoAktual, setTodoAktual] = useState<KonfirmasiBeli[]>(initialTodoAktual);
  const [todoBayarSilang, setTodoBayarSilang] = useState<KonfirmasiBeli[]>(initialTodoBayarSilang);
  
  // Selected transactions for forms
  const [selectedTxAktual, setSelectedTxAktual] = useState<KonfirmasiBeli | null>(null);
  const [selectedTxSilang, setSelectedTxSilang] = useState<KonfirmasiBeli | null>(null);

  // Form states - Aktual
  const [actual, setActual] = useState("");
  const [accPusatActual, setAccPusatActual] = useState(true);
  const [noAccPusatActual, setNoAccPusatActual] = useState("");

  // Form states - Bayar Silang
  const [nomorBayarSilang, setNomorBayarSilang] = useState("");
  const [lebihPlafon, setLebihPlafon] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshData = async () => {
    const { data, error } = await supabase
      .from("konfirmasi_beli")
      .select(`
        *,
        verifikasi_kartu!inner(
          collect_data!inner(
            nama,
            nomor_kartu,
            cabang
          )
        ),
        aktual(aktual_id),
        bayar_silang(silang_id)
      `)
      .eq("beli", true);

    if (!error && data) {
      // Filter todoAktual
      const filteredAktual = data.filter((row: any) => {
        const isNotAktual = !row.aktual || row.aktual.length === 0;
        const condA = row.cek_mutasi === false;
        const condB =
          row.cek_mutasi === true &&
          row.bayar_silang &&
          row.bayar_silang.length > 0;
        return isNotAktual && (condA || condB);
      });

      // Filter todoBayarSilang
      const filteredSilang = data.filter((row: any) => {
        const isNotSilang = !row.bayar_silang || row.bayar_silang.length === 0;
        const cond = row.cek_mutasi === true;
        return isNotSilang && cond;
      });

      setTodoAktual(filteredAktual as any[]);
      setTodoBayarSilang(filteredSilang as any[]);
    }
  };

  const handleOpenAktualForm = (tx: KonfirmasiBeli) => {
    setSelectedTxAktual(tx);
    setActual("");
    setAccPusatActual(true);
    setNoAccPusatActual("");
    setErrorMsg("");
  };

  const handleSaveAktual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxAktual) return;

    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("aktual").insert([
      {
        konfirmasi_id: selectedTxAktual.konfirmasi_id,
        actual: actual,
        acc_pusat_actual: accPusatActual,
        no_acc_pusat_actual: noAccPusatActual || null,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSelectedTxAktual(null);
      setLoading(false);
      await refreshData();
      router.push("/keuangan/transaction");
    }
  };

  const handleOpenSilangForm = (tx: KonfirmasiBeli) => {
    setSelectedTxSilang(tx);
    setNomorBayarSilang("");
    setLebihPlafon("");
    setErrorMsg("");
  };

  const handleSaveSilang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxSilang) return;

    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("bayar_silang").insert([
      {
        konfirmasi_id: selectedTxSilang.konfirmasi_id,
        nomor_bayar_silang: nomorBayarSilang,
        lebih_plafon: lebihPlafon || null,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSelectedTxSilang(null);
      setLoading(false);
      await refreshData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        {/* Header Section */}
        <div className="border-b border-slate-850 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Keuangan Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manajemen pembayaran, mutasi, dan pencatatan transaksi aktual dari seluruh cabang nasional.
          </p>
        </div>

        {/* SECTION 1: ANTRIAN BAYAR SILANG */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>1. Antrean Bayar Silang (Cek Mutasi = True)</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              {todoBayarSilang.length} Antrean
            </span>
          </div>

          {todoBayarSilang.length === 0 ? (
            <div className="py-8 text-center bg-slate-900/10 border border-slate-850 rounded-xl text-slate-500 text-sm">
              Tidak ada antrean pembayaran silang.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6">ID Konfirmasi</th>
                    <th className="py-3 px-6">Konsumen</th>
                    <th className="py-3 px-6">Cabang</th>
                    <th className="py-3 px-6">Nomor Kartu</th>
                    <th className="py-3 px-6">No. SP / Resep</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-sm">
                  {todoBayarSilang.map((tx) => (
                    <tr key={tx.konfirmasi_id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-6 font-mono text-slate-450">#K-{tx.konfirmasi_id}</td>
                      <td className="py-3 px-6 font-medium text-white">{tx.verifikasi_kartu?.collect_data?.nama}</td>
                      <td className="py-3 px-6 uppercase font-semibold text-xs text-indigo-400">
                        {tx.verifikasi_kartu?.collect_data?.cabang}
                      </td>
                      <td className="py-3 px-6 font-mono text-slate-350">
                        {tx.verifikasi_kartu?.collect_data?.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim()}
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-400">
                        <div>SP: {tx.nomor_sp || "-"}</div>
                        <div>Resep: {tx.resep || "-"}</div>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleOpenSilangForm(tx)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-650 text-white transition cursor-pointer"
                        >
                          Input Bayar Silang
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: ANTRIAN AKTUAL */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>2. Antrean Transaksi Aktual (To-Do Aktual)</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              {todoAktual.length} Antrean
            </span>
          </div>

          {todoAktual.length === 0 ? (
            <div className="py-8 text-center bg-slate-900/10 border border-slate-850 rounded-xl text-slate-500 text-sm">
              Tidak ada antrean pencatatan aktual.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6">ID Konfirmasi</th>
                    <th className="py-3 px-6">Konsumen</th>
                    <th className="py-3 px-6">Cabang</th>
                    <th className="py-3 px-6">Nomor Kartu</th>
                    <th className="py-3 px-6">Status Cek Mutasi</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-sm">
                  {todoAktual.map((tx) => (
                    <tr key={tx.konfirmasi_id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-6 font-mono text-slate-450">#K-{tx.konfirmasi_id}</td>
                      <td className="py-3 px-6 font-medium text-white">{tx.verifikasi_kartu?.collect_data?.nama}</td>
                      <td className="py-3 px-6 uppercase font-semibold text-xs text-indigo-400">
                        {tx.verifikasi_kartu?.collect_data?.cabang}
                      </td>
                      <td className="py-3 px-6 font-mono text-slate-350">
                        {tx.verifikasi_kartu?.collect_data?.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim()}
                      </td>
                      <td className="py-3 px-6">
                        {tx.cek_mutasi ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Mutasi OK (Terbayar Silang)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            Tanpa Mutasi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleOpenAktualForm(tx)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-650 text-white transition cursor-pointer"
                        >
                          Input Aktual
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* FORM INPUT BAYAR SILANG MODAL */}
      {selectedTxSilang && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Input Bayar Silang</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Konfirmasi ID #{selectedTxSilang.konfirmasi_id} | Pelanggan: {selectedTxSilang.verifikasi_kartu?.collect_data?.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedTxSilang(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveSilang} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor Bayar Silang
                </label>
                <input
                  type="text"
                  value={nomorBayarSilang}
                  onChange={(e) => setNomorBayarSilang(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="Nomor referensi pembayaran silang"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Lebih Plafon
                </label>
                <input
                  type="text"
                  value={lebihPlafon}
                  onChange={(e) => setLebihPlafon(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="e.g. 200000"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedTxSilang(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-slate-330 font-medium text-sm transition text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-lg shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM INPUT AKTUAL MODAL */}
      {selectedTxAktual && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Input Transaksi Aktual</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Konfirmasi ID #{selectedTxAktual.konfirmasi_id} | Pelanggan: {selectedTxAktual.verifikasi_kartu?.collect_data?.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedTxAktual(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveAktual} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Actual Amount (Pencatatan Aktual)
                </label>
                <input
                  type="text"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="e.g. 4800000"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="accPusat"
                  checked={accPusatActual}
                  onChange={(e) => setAccPusatActual(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                />
                <label htmlFor="accPusat" className="text-sm font-medium text-slate-350 select-none">
                  ACC Pusat (Acc Pusat Actual)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor ACC Pusat Actual
                </label>
                <input
                  type="text"
                  value={noAccPusatActual}
                  onChange={(e) => setNoAccPusatActual(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="Nomor referensi ACC Pusat"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedTxAktual(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-slate-300 font-medium text-sm transition text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-lg shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Transaksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createPagesServerClient(context);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const role = session.user.user_metadata?.role || "keuangan";

  if (role !== "keuangan") {
    return {
      redirect: {
        destination: `/${role}/dashboard`,
        permanent: false,
      },
    };
  }

  // Fetch all konfirmasi_beli that are deal (beli = true)
  const { data, error } = await supabase
    .from("konfirmasi_beli")
    .select(`
      *,
      verifikasi_kartu!inner(
        collect_data!inner(
          nama,
          nomor_kartu,
          cabang
        )
      ),
      aktual(aktual_id),
      bayar_silang(silang_id)
    `)
    .eq("beli", true);

  const rawList = error || !data ? [] : data;

  // Filter todoAktual
  const initialTodoAktual = rawList.filter((row: any) => {
    const isNotAktual = !row.aktual || row.aktual.length === 0;
    const condA = row.cek_mutasi === false;
    const condB =
      row.cek_mutasi === true &&
      row.bayar_silang &&
      row.bayar_silang.length > 0;
    return isNotAktual && (condA || condB);
  });

  // Filter todoBayarSilang
  const initialTodoBayarSilang = rawList.filter((row: any) => {
    const isNotSilang = !row.bayar_silang || row.bayar_silang.length === 0;
    const cond = row.cek_mutasi === true;
    return isNotSilang && cond;
  });

  return {
    props: {
      user: {
        email: session.user.email,
        role,
        cabang: "",
      },
      initialTodoAktual,
      initialTodoBayarSilang,
    },
  };
};
