import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const query = supabase
        .from("post_produksi")
        .select(`
          *,
          pra_produksi(*, konfirmasi_beli(*, verifikasi_kartu(*, collect_data(*))))
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];

      // Filter by branch for Admin / CS
      if (user.role === "admin" || user.role === "cs") {
        result = result.filter(
          (row: any) =>
            row.pra_produksi?.konfirmasi_beli?.verifikasi_kartu?.collect_data &&
            row.pra_produksi.konfirmasi_beli.verifikasi_kartu.collect_data.cabang === user.cabang
        );
      }

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === "POST") {
    // Only Gudang can record post-production info
    if (user.role !== "gudang") {
      return res.status(403).json({ error: "Only Gudang staff can record post-production status." });
    }

    try {
      const {
        pra_id,
        no_faktur,
        sudah_produksi,
        petugas_produksi,
        tanggal_selesai_produksi,
        proses_pengiriman,
        quality_control,
        resi_pengiriman,
      } = req.body;

      if (
        pra_id === undefined ||
        !no_faktur ||
        sudah_produksi === undefined ||
        !petugas_produksi ||
        !tanggal_selesai_produksi ||
        proses_pengiriman === undefined ||
        quality_control === undefined ||
        !resi_pengiriman
      ) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const insertData = {
        pra_id,
        no_faktur,
        sudah_produksi,
        petugas_produksi,
        tanggal_selesai_produksi,
        proses_pengiriman,
        quality_control,
        resi_pengiriman,
      };

      const { data, error } = await supabase
        .from("post_produksi")
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
