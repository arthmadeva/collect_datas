import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const query = supabase
        .from("aktual")
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
    // Only Keuangan can create actual payment records
    if (user.role !== "keuangan") {
      return res.status(403).json({ error: "Only Keuangan staff can record actual payments." });
    }

    try {
      const { konfirmasi_id, actual, acc_pusat_actual, no_acc_pusat_actual } = req.body;

      if (konfirmasi_id === undefined || !actual || acc_pusat_actual === undefined || !no_acc_pusat_actual) {
        return res.status(400).json({ error: "All fields are required." });
      }

      const insertData = {
        konfirmasi_id,
        actual,
        acc_pusat_actual,
        no_acc_pusat_actual,
      };

      const { data, error } = await supabase
        .from("aktual")
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
