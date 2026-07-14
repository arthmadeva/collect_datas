import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const { queue } = req.query;

      const query = supabase
        .from("pra_produksi")
        .select(`
          *,
          konfirmasi_beli(*, verifikasi_kartu(*, collect_data(*))),
          post_produksi(post_id)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];

      // Filter by branch for Admin / CS
      if (user.role === "admin" || user.role === "cs") {
        result = result.filter(
          (row: any) =>
            row.konfirmasi_beli?.verifikasi_kartu?.collect_data &&
            row.konfirmasi_beli.verifikasi_kartu.collect_data.cabang === user.cabang
        );
      }

      // If queue filter is requested, keep only those not in post_produksi yet
      if (queue === "true") {
        result = result.filter(
          (row: any) => !row.post_produksi || row.post_produksi.length === 0
        );
      }

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === "POST") {
    // Only Gudang can record pre-production info
    if (user.role !== "gudang") {
      return res.status(403).json({ error: "Only Gudang staff can record pre-production status." });
    }

    try {
      const {
        konfirmasi_id,
        tanggal_terima_frame,
        sudah_terima_frame,
        stock,
        gosok,
        tanggal_terima_lensa,
      } = req.body;

      if (
        konfirmasi_id === undefined ||
        !tanggal_terima_frame ||
        sudah_terima_frame === undefined ||
        stock === undefined ||
        gosok === undefined ||
        !tanggal_terima_lensa
      ) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const insertData = {
        konfirmasi_id,
        tanggal_terima_frame, // Correct column verified in DB
        sudah_terima_frame,
        stock,
        gosok,
        tanggal_terima_lensa,
      };

      const { data, error } = await supabase
        .from("pra_produksi")
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
