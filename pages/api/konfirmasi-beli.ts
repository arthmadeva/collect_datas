import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const { queueType } = req.query;

      // Select confirmation along with verification details, customer details, actual, bayar silang, and pra-produksi status
      const query = supabase
        .from("konfirmasi_beli")
        .select(`
          *,
          verifikasi_kartu(*, collect_data(*)),
          aktual(aktual_id),
          bayar_silang(silang_id),
          pra_produksi(pra_id)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];

      // Branch check for CS & Admin
      if (user.role === "admin" || user.role === "cs") {
        result = result.filter(
          (row: any) =>
            row.verifikasi_kartu?.collect_data &&
            row.verifikasi_kartu.collect_data.cabang === user.cabang
        );
      }

      // Filter based on queueType
      if (queueType === "aktual") {
        // Table To-Do Aktual: beli = true AND aktual is empty AND:
        // - Condition A: cek_mutasi = false
        // - Condition B: cek_mutasi = true AND bayar_silang is NOT empty
        result = result.filter((row: any) => {
          const isBeli = row.beli === true;
          const isNotAktual = !row.aktual || row.aktual.length === 0;
          
          if (!isBeli || !isNotAktual) return false;

          const condA = row.cek_mutasi === false;
          const condB = row.cek_mutasi === true && row.bayar_silang && row.bayar_silang.length > 0;

          return condA || condB;
        });
      } else if (queueType === "bayar_silang") {
        // Table To-Do Bayar Silang: beli = true AND cek_mutasi = true AND bayar_silang is empty
        result = result.filter((row: any) => {
          const isBeli = row.beli === true;
          const isCekMutasi = row.cek_mutasi === true;
          const isNotBayarSilang = !row.bayar_silang || row.bayar_silang.length === 0;

          return isBeli && isCekMutasi && isNotBayarSilang;
        });
      } else if (queueType === "pra_produksi") {
        // Table 1 Gudang (Antrean Pra-Produksi): beli = true AND pra_produksi is empty
        result = result.filter((row: any) => {
          const isBeli = row.beli === true;
          const isNotPraProduksi = !row.pra_produksi || row.pra_produksi.length === 0;

          return isBeli && isNotPraProduksi;
        });
      }

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === "POST") {
    // Only Admin can create konfirmasi_beli
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only Admin Cabang can submit purchase confirmations." });
    }

    try {
      const {
        verifikasi_id,
        beli,
        resep,
        nomor_sp,
        alamat_kirim,
        tanggal_kirim_frame,
        tanggal_kirim_lensa,
        cek_mutasi,
        id_form,
      } = req.body;

      if (verifikasi_id === undefined || beli === undefined || cek_mutasi === undefined || !id_form) {
        return res.status(400).json({ error: "Required fields are missing." });
      }

      // Check parent verification and branch
      const { data: vkData, error: vkError } = await supabase
        .from("verifikasi_kartu")
        .select("*, collect_data(*)")
        .eq("verifikasi_id", verifikasi_id)
        .single();

      if (vkError || !vkData) {
        return res.status(404).json({ error: "Parent card verification data not found." });
      }

      if (vkData.collect_data?.cabang !== user.cabang) {
        return res.status(403).json({
          error: `Access denied. This record belongs to branch [${vkData.collect_data?.cabang}], but your branch is [${user.cabang}].`,
        });
      }

      const insertData = {
        verifikasi_id,
        beli,
        resep: resep || null,
        nomor_sp: nomor_sp || null,
        alamat_kirim: alamat_kirim || null,
        tanggal_kirim_frame: tanggal_kirim_frame || null,
        tanggal_kirim_lensa: tanggal_kirim_lensa || null,
        cek_mutasi,
        id_form,
      };

      const { data, error } = await supabase
        .from("konfirmasi_beli")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
