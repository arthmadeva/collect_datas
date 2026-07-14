import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const query = supabase
        .from("bayar_silang")
        .select(`
          *,
          konfirmasi_beli(*, verifikasi_kartu(*, collect_data(*)))
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

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === "POST") {
    // Only Keuangan can record bayar silang
    if (user.role !== "keuangan") {
      return res.status(403).json({ error: "Only Keuangan staff can record excess payment adjustments." });
    }

    try {
      const { konfirmasi_id, nomor_bayar_silang, lebih_plafon } = req.body;

      if (konfirmasi_id === undefined || !nomor_bayar_silang || !lebih_plafon) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const insertData = {
        konfirmasi_id,
        nomor_bayar_silang,
        lebih_plafon,
      };

      const { data, error } = await supabase
        .from("bayar_silang")
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
