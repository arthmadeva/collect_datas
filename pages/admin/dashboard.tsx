import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface CollectData {
  transaksi_id: number;
  nama: string;
  nomor_kartu: string;
  cabang: string;
}

interface VerifikasiKartu {
  verifikasi_id: number;
  transaksi_id: number;
  created_at: string;
  nama_cs: string;
  tanggal_telepon: string;
  jam_telepon: string;
  plafon: string;
  verif_hp: boolean;
  collect_data: CollectData;
}

export default function AdminDashboard() {
  const [queue, setQueue] = useState<VerifikasiKartu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal 1: Create New Data
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTanggalLahir, setNewTanggalLahir] = useState("");
  const [newNoHp, setNewNoHp] = useState("");
  const [newNomorKartu, setNewNomorKartu] = useState("");
  const [newUnitBri, setNewUnitBri] = useState("");
  const [newPromotor, setNewPromotor] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal 2: Confirmation Purchase Form
  const [selectedVk, setSelectedVk] = useState<VerifikasiKartu | null>(null);
  const [beli, setBeli] = useState(true);
  const [resep, setResep] = useState("");
  const [nomorSp, setNomorSp] = useState("");
  const [alamatKirim, setAlamatKirim] = useState("");
  const [tanggalKirimFrame, setTanggalKirimFrame] = useState("");
  const [tanggalKirimLensa, setTanggalKirimLensa] = useState("");
  const [cekMutasi, setCekMutasi] = useState(false);
  const [idForm, setIdForm] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/verifikasi-kartu?queue=true");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengambil antrean verifikasi");
      }
      const data = await res.json();
      setQueue(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/collect-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newNama,
          email: newEmail,
          tanggal_lahir: newTanggalLahir,
          no_hp: newNoHp,
          nomor_kartu: newNomorKartu,
          unit_bri: newUnitBri,
          promotor: newPromotor,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal membuat data baru");
      }

      // Reset Create Form
      setNewNama("");
      setNewEmail("");
      setNewTanggalLahir("");
      setNewNoHp("");
      setNewNomorKartu("");
      setNewUnitBri("");
      setNewPromotor("");
      setIsCreateModalOpen(false);
      
      // Refresh list
      fetchQueue();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const openConfirmModal = (vk: VerifikasiKartu) => {
    setSelectedVk(vk);
    setBeli(true);
    setResep("");
    setNomorSp("");
    setAlamatKirim("");
    
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setTanggalKirimFrame(formattedDate);
    setTanggalKirimLensa(formattedDate);
    
    setCekMutasi(false);
    setIdForm("");
    setConfirmError(null);
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVk) return;

    setConfirmLoading(true);
    setConfirmError(null);

    try {
      const res = await fetch("/api/konfirmasi-beli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifikasi_id: selectedVk.verifikasi_id,
          beli,
          resep: beli ? resep : "",
          nomor_sp: beli ? nomorSp : "",
          alamat_kirim: beli ? alamatKirim : "",
          tanggal_kirim_frame: beli ? tanggalKirimFrame : null,
          tanggal_kirim_lensa: beli ? tanggalKirimLensa : null,
          cek_mutasi: cekMutasi,
          id_form: idForm,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan konfirmasi pembelian");
      }

      setSelectedVk(null);
      fetchQueue();
    } catch (err: any) {
      setConfirmError(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="dashboard" role="admin" title="Dashboard Admin Cabang">
      {/* Upper Actions Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div>
          <h3 className="text-lg font-bold text-white">Kelola Data Collect Baru</h3>
          <p className="text-slate-400 text-sm mt-0.5">
            Daftarkan entri prospek pelanggan baru langsung di bawah unit cabang Anda.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white transition duration-200 transform active:scale-95 shadow-md shadow-teal-500/10 flex items-center space-x-2 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Buat Data Baru</span>
        </button>
      </div>

      <h3 className="text-lg font-bold text-white mb-4">Antrean Konfirmasi Pembelian</h3>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-sm">
          Error: {error}
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Semua Kartu Terkonfirmasi!</h3>
          <p className="text-slate-400 text-sm">
            Semua kartu yang telah diverifikasi oleh CS di cabang Anda sudah memiliki status konfirmasi pembelian.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tgl Verifikasi</th>
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">No. Kartu</th>
                  <th className="px-6 py-4">CS Pemeriksa</th>
                  <th className="px-6 py-4">Plafon Verif</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                {queue.map((row) => (
                  <tr key={row.verifikasi_id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.collect_data ? (
                        <>
                          <div className="font-semibold text-white">{row.collect_data.nama}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">{row.collect_data.nomor_kartu}</div>
                        </>
                      ) : (
                        <span className="text-rose-400 italic">Data Dihapus</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tracking-wide text-slate-300">
                      {row.collect_data?.nomor_kartu || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                      {row.nama_cs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-semibold">
                      Rp {Number(row.plafon).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openConfirmModal(row)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition shadow-md shadow-indigo-500/10 cursor-pointer"
                      >
                        Konfirmasi Beli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create New Data Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Input Data Collect Baru</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {createError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_nama">
                  Nama Konsumen
                </label>
                <input
                  id="c_nama"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Nama lengkap..."
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_email">
                    Email
                  </label>
                  <input
                    id="c_email"
                    type="email"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="email@domain.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_dob">
                    Tanggal Lahir
                  </label>
                  <input
                    id="c_dob"
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    value={newTanggalLahir}
                    onChange={(e) => setNewTanggalLahir(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_hp">
                    Nomor HP
                  </label>
                  <input
                    id="c_hp"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="Contoh: 0812xxxx"
                    value={newNoHp}
                    onChange={(e) => setNewNoHp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_card">
                    Nomor Kartu BRI
                  </label>
                  <input
                    id="c_card"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="Contoh: 4400xxxx"
                    value={newNomorKartu}
                    onChange={(e) => setNewNomorKartu(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_unit">
                    Unit BRI
                  </label>
                  <input
                    id="c_unit"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="BRI KC Bandung"
                    value={newUnitBri}
                    onChange={(e) => setNewUnitBri(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="c_promotor">
                    Promotor / SPG
                  </label>
                  <input
                    id="c_promotor"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="Nama promotor..."
                    value={newPromotor}
                    onChange={(e) => setNewPromotor(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {createLoading ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Konfirmasi Beli Modal */}
      {selectedVk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedVk(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Form Konfirmasi Pembelian</h3>
            <p className="text-xs text-slate-400 mb-5">
              Konsumen: <span className="font-semibold text-teal-400">{selectedVk.collect_data?.nama}</span> | CS: <span className="font-semibold text-indigo-400">{selectedVk.nama_cs}</span>
            </p>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              {confirmError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {confirmError}
                </div>
              )}

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <input
                  id="beli_ya"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                  checked={beli}
                  onChange={(e) => setBeli(e.target.checked)}
                />
                <label htmlFor="beli_ya" className="text-slate-300 text-xs select-none">
                  <div className="font-semibold text-white">Deal Pembelian (Beli)</div>
                  <div className="text-slate-400 mt-0.5">Konsumen sepakat untuk melakukan pembelian</div>
                </label>
              </div>

              {beli && (
                <>
                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="resep">
                      Resep Kacamata
                    </label>
                    <input
                      id="resep"
                      type="text"
                      required
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                      placeholder="Contoh: R: -1.00 L: -1.25 Cyl: -0.50"
                      value={resep}
                      onChange={(e) => setResep(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="nomor_sp">
                        Nomor SP
                      </label>
                      <input
                        id="nomor_sp"
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                        placeholder="SP-00123"
                        value={nomorSp}
                        onChange={(e) => setNomorSp(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="id_form">
                        ID Form Aplikasi
                      </label>
                      <input
                        id="id_form"
                        type="text"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                        placeholder="F55-XXXX"
                        value={idForm}
                        onChange={(e) => setIdForm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="alamat">
                      Alamat Pengiriman Fisik
                    </label>
                    <textarea
                      id="alamat"
                      required
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition resize-none"
                      placeholder="Alamat lengkap penerima..."
                      value={alamatKirim}
                      onChange={(e) => setAlamatKirim(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="tgl_frame">
                        Tgl Kirim Frame
                      </label>
                      <input
                        id="tgl_frame"
                        type="date"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                        value={tanggalKirimFrame}
                        onChange={(e) => setTanggalKirimFrame(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="tgl_lensa">
                        Tgl Kirim Lensa
                      </label>
                      <input
                        id="tgl_lensa"
                        type="date"
                        required
                        className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                        value={tanggalKirimLensa}
                        onChange={(e) => setTanggalKirimLensa(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <input
                  id="mutasi"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                  checked={cekMutasi}
                  onChange={(e) => setCekMutasi(e.target.checked)}
                />
                <label htmlFor="mutasi" className="text-slate-300 text-xs select-none">
                  <div className="font-semibold text-white">Butuh Cek Mutasi Bank</div>
                  <div className="text-slate-400 mt-0.5">Wajib memicu verifikasi mutasi bayar silang di keuangan</div>
                </label>
              </div>

              {!beli && (
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="id_form_cancel">
                    ID Form (Wajib diisi sebagai referensi pembatalan)
                  </label>
                  <input
                    id="id_form_cancel"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="F55-CANCEL-XX"
                    value={idForm}
                    onChange={(e) => setIdForm(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedVk(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={confirmLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {confirmLoading ? "Menyimpan..." : "Kirim Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
