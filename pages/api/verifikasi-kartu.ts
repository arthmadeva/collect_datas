import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const { queue } = req.query;

      // Select verification details along with customer data and confirmation status
      let query = supabase
        .from("verifikasi_kartu")
        .select("*, collect_data(*), konfirmasi_beli(konfirmasi_id)")
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];

      // Filter by branch for Admin / CS
      if (user.role === "admin" || user.role === "cs") {
        result = result.filter(
          (row: any) => row.collect_data && row.collect_data.cabang === user.cabang
        );
      }

      // If queue filter is requested, keep only those not confirmed yet
      if (queue === "true") {
        result = result.filter(
          (row: any) => !row.konfirmasi_beli || row.konfirmasi_beli.length === 0
        );
      }

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === "POST") {
    // Only CS can create verifikasi_kartu
    if (user.role !== "cs") {
      return res.status(403).json({ error: "Only Customer Service (CS) can submit card verification." });
    }

    try {
      const { transaksi_id, nama_cs, tanggal_telepon, jam_telepon, plafon, verif_hp } = req.body;

      if (!transaksi_id || !nama_cs || !tanggal_telepon || !jam_telepon || !plafon || verif_hp === undefined) {
        return res.status(400).json({ error: "All fields are required." });
      }

      // Verify the branch of parent collect_data matches CS's branch
      const { data: parentData, error: parentError } = await supabase
        .from("collect_data")
        .select("cabang")
        .eq("transaksi_id", transaksi_id)
        .single();

      if (parentError || !parentData) {
        return res.status(404).json({ error: "Parent transaction data not found." });
      }

      if (parentData.cabang !== user.cabang) {
        return res.status(403).json({
          error: `Access denied. This transaction belongs to branch [${parentData.cabang}], but your branch is [${user.cabang}].`,
        });
      }

      const insertData = {
        transaksi_id,
        nama_cs,
        tanggal_telepon,
        jam_telepon,
        plafon,
        verif_hp,
      };

      const { data, error } = await supabase
        .from("verifikasi_kartu")
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
