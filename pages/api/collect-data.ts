import type { NextApiRequest, NextApiResponse } from "next";
import { verifyApiAuth } from "@/utils/api-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authResult = await verifyApiAuth(req, res);
  if (!authResult) return;

  const { supabase, user } = authResult;

  if (req.method === "GET") {
    try {
      const { queue } = req.query;

      // Select data and check verifikasi_kartu status
      let query = supabase
        .from("collect_data")
        .select("*, verifikasi_kartu(verifikasi_id)")
        .order("created_at", { ascending: false });

      if (user.role === "admin" || user.role === "cs") {
        query = query.eq("cabang", user.cabang);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];

      // If queue filter is requested, keep only those not verified
      if (queue === "true") {
        result = result.filter(
          (row: any) => !row.verifikasi_kartu || row.verifikasi_kartu.length === 0
        );
      }

      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === "POST") {
    // Only Admin Cabang can create collect_data
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Only Admin can create new data." });
    }

    try {
      const { nama, email, tanggal_lahir, no_hp, nomor_kartu, unit_bri, promotor } = req.body;

      if (!nama || !email || !tanggal_lahir || !no_hp || !nomor_kartu || !unit_bri || !promotor) {
        return res.status(400).json({ error: "All fields are required." });
      }

      // Enforce admin's own branch
      const insertData = {
        nama,
        email,
        tanggal_lahir,
        no_hp,
        nomor_kartu,
        unit_bri,
        promotor,
        cabang: user.cabang, // Forced to admin's branch
      };

      const { data, error } = await supabase
        .from("collect_data")
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
