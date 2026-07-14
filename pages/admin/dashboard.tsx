import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

interface VerifikasiKartu {
  verifikasi_id: number;
  transaksi_id: number;
  created_at: string;
  nama_cs: string;
  tanggal_telepon: string;
  jam_telepon: string;
  plafon: string;
  verif_hp: boolean;
  collect_data: {
    nama: string;
    email: string;
    nomor_kartu: string;
    no_hp: string;
    unit_bri: string;
    promotor: string;
  };
}

interface AdminDashboardProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialQueue: VerifikasiKartu[];
}

export default function AdminDashboard({ user, initialQueue }: AdminDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [queue, setQueue] = useState<VerifikasiKartu[]>(initialQueue);
  
  // Modals visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedVerifyTx, setSelectedVerifyTx] = useState<VerifikasiKartu | null>(null);

  // Form Create Collect Data
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [noHp, setNoHp] = useState("");
  const [nomorKartu, setNomorKartu] = useState("");
  const [unitBri, setUnitBri] = useState("");
  const [promotor, setPromotor] = useState("");
  
  // Form Konfirmasi Beli
  const [beli, setBeli] = useState(true);
  const [resep, setResep] = useState("");
  const [nomorSp, setNomorSp] = useState("");
  const [alamatKirim, setAlamatKirim] = useState("");
  const [tanggalKirimFrame, setTanggalKirimFrame] = useState("");
  const [tanggalKirimLensa, setTanggalKirimLensa] = useState("");
  const [cekMutasi, setCekMutasi] = useState(false);
  const [idForm, setIdForm] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshQueue = async () => {
    const { data, error } = await supabase
      .from("verifikasi_kartu")
      .select("*, collect_data!inner(*), konfirmasi_beli(konfirmasi_id)")
      .eq("collect_data.cabang", user.cabang);

    if (!error && data) {
      const filtered = data.filter(
        (row: any) => !row.konfirmasi_beli || row.konfirmasi_beli.length === 0
      );
      setQueue(filtered as any[]);
    }
  };

  const handleCreateCollectData = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("collect_data").insert([
      {
        nama,
        email,
        tanggal_lahir: tanggalLahir || null,
        no_hp: noHp,
        nomor_kartu: nomorKartu,
        unit_bri: unitBri,
        promotor,
        cabang: user.cabang, // auto filled
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setShowCreateModal(false);
      setLoading(false);
      // reset form
      setNama("");
      setEmail("");
      setTanggalLahir("");
      setNoHp("");
      setNomorKartu("");
      setUnitBri("");
      setPromotor("");
      // refresh (although queue shows verifikasi_kartu, so it won't show in the queue table until CS verifes it)
      await refreshQueue();
      alert("Sukses menambah data collect baru. Menunggu verifikasi dari CS.");
    }
  };

  const handleOpenKonfirmasiForm = (v: VerifikasiKartu) => {
    setSelectedVerifyTx(v);
    setBeli(true);
    setResep("");
    setNomorSp("");
    setAlamatKirim("");
    setTanggalKirimFrame("");
    setTanggalKirimLensa("");
    setCekMutasi(false);
    setIdForm("");
    setErrorMsg("");
  };

  const handleSaveKonfirmasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerifyTx) return;

    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("konfirmasi_beli").insert([
      {
        verifikasi_id: selectedVerifyTx.verifikasi_id,
        beli,
        resep: resep || null,
        nomor_sp: nomorSp || null,
        alamat_kirim: alamatKirim || null,
        tanggal_kirim_frame: tanggalKirimFrame || null,
        tanggal_kirim_lensa: tanggalKirimLensa || null,
        cek_mutasi: cekMutasi,
        id_form: idForm || null,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSelectedVerifyTx(null);
      setLoading(false);
      await refreshQueue();
      router.push("/admin/transaction");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Cabang Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Daftar verifikasi kartu cabang <span className="text-indigo-400 font-semibold uppercase">{user.cabang}</span> yang siap dikonfirmasi beli.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setErrorMsg("");
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-650 text-white transition-all shadow-md shadow-indigo-500/10 flex items-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Data</span>
            </button>
          </div>
        </div>

        {/* Queue Table */}
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
            <svg
              className="w-12 h-12 text-slate-650 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-slate-400 text-sm">Tidak ada kartu terverifikasi yang antre untuk konfirmasi beli.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-855 bg-slate-900/35">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID Verifikasi</th>
                  <th className="py-4 px-6">Konsumen</th>
                  <th className="py-4 px-6">Nomor Kartu</th>
                  <th className="py-4 px-6">Status Verifikasi</th>
                  <th className="py-4 px-6">Plafon</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-sm">
                {queue.map((item) => (
                  <tr key={item.verifikasi_id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-mono text-slate-400">#V-{item.verifikasi_id}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{item.collect_data?.nama}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.collect_data?.email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-350 font-mono">
                      {item.collect_data?.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-350 text-xs">CS: {item.nama_cs}</div>
                      <div className="mt-1">
                        {item.verif_hp ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            HP OK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            HP Fail
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-indigo-400 font-medium font-mono">
                      Rp {Number(item.plafon).toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenKonfirmasiForm(item)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-650 text-white transition shadow shadow-indigo-500/10 cursor-pointer"
                      >
                        Konfirmasi Beli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* CREATE COLLECT DATA MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Create New Data</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Masukkan data transaksi konsumen baru untuk cabang <span className="uppercase text-indigo-400 font-medium">{user.cabang}</span>
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreateCollectData} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Konsumen
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="Nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={tanggalLahir}
                    onChange={(e) => setTanggalLahir(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    No. Handphone (WA)
                  </label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor Kartu (BRI)
                </label>
                <input
                  type="text"
                  value={nomorKartu}
                  onChange={(e) => setNomorKartu(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="e.g. 440001231234"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Unit BRI
                  </label>
                  <input
                    type="text"
                    value={unitBri}
                    onChange={(e) => setUnitBri(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="e.g. BRI Klaten"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Promotor
                  </label>
                  <input
                    type="text"
                    value={promotor}
                    onChange={(e) => setPromotor(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="e.g. RE"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM KONFIRMASI BELI MODAL */}
      {selectedVerifyTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Form Konfirmasi Beli</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verifikasi ID #{selectedVerifyTx.verifikasi_id} | Pelanggan: {selectedVerifyTx.collect_data?.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedVerifyTx(null)}
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

            <form onSubmit={handleSaveKonfirmasi} className="space-y-4">
              <div className="flex items-center space-x-6 py-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="beliTrue"
                    name="beli"
                    checked={beli === true}
                    onChange={() => setBeli(true)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                  />
                  <label htmlFor="beliTrue" className="ml-2 text-sm text-slate-200 font-medium select-none">
                    Beli (Deal)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="beliFalse"
                    name="beli"
                    checked={beli === false}
                    onChange={() => setBeli(false)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                  />
                  <label htmlFor="beliFalse" className="ml-2 text-sm text-slate-200 font-medium select-none">
                    Tidak Beli (Cancel)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Resep Lensa
                </label>
                <input
                  type="text"
                  value={resep}
                  onChange={(e) => setResep(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="e.g. OD: -1.00, OS: -1.25"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor SP
                  </label>
                  <input
                    type="text"
                    value={nomorSp}
                    onChange={(e) => setNomorSp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="No. Surat Pesanan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    ID Form
                  </label>
                  <input
                    type="text"
                    value={idForm}
                    onChange={(e) => setIdForm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="e.g. FORM-55"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Alamat Kirim
                </label>
                <textarea
                  value={alamatKirim}
                  onChange={(e) => setAlamatKirim(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition min-h-[70px]"
                  placeholder="Alamat lengkap pengiriman barang"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Kirim Frame
                  </label>
                  <input
                    type="date"
                    value={tanggalKirimFrame}
                    onChange={(e) => setTanggalKirimFrame(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Kirim Lensa
                  </label>
                  <input
                    type="date"
                    value={tanggalKirimLensa}
                    onChange={(e) => setTanggalKirimLensa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="cekMutasi"
                  checked={cekMutasi}
                  onChange={(e) => setCekMutasi(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                />
                <label htmlFor="cekMutasi" className="text-sm font-medium text-slate-350 select-none">
                  Memerlukan Cek Mutasi Bank (Silang)
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedVerifyTx(null)}
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
                  <span>Simpan Konfirmasi</span>
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

  const role = session.user.user_metadata?.role || "admin";
  const cabang = session.user.user_metadata?.cabang || "";

  if (role !== "admin") {
    return {
      redirect: {
        destination: `/${role}/dashboard`,
        permanent: false,
      },
    };
  }

  // Fetch queue: verifikasi_kartu rows which do NOT exist in konfirmasi_beli
  const { data, error } = await supabase
    .from("verifikasi_kartu")
    .select("*, collect_data!inner(*), konfirmasi_beli(konfirmasi_id)")
    .eq("collect_data.cabang", cabang);

  const initialQueue = error || !data ? [] : data.filter(
    (row: any) => !row.konfirmasi_beli || row.konfirmasi_beli.length === 0
  );

  return {
    props: {
      user: {
        email: session.user.email,
        role,
        cabang,
      },
      initialQueue,
    },
  };
};
