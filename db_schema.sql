-- ========================================================
-- SCHEMA EXTRA FOR PROJECT: AKUR (Akur Optic 55)
-- centralize-transactions schema additions
-- ========================================================

-- 1. USER PROFILES TABLE
-- Storing roles and branch information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'cs', 'keuangan', 'gudang')),
  cabang text, -- nullable, only applicable for 'admin' and 'cs'
  created_at timestamp with time zone DEFAULT now()
);

-- 2. TRIGGER FOR NEW USER SYNC
-- Automatically maps auth metadata to public.user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, cabang)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'cs'),
    new.raw_user_meta_data->>'cabang'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. ENABLE RLS ON ALL TABLES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collect_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifikasi_kartu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.konfirmasi_beli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aktual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bayar_silang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pra_produksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_produksi ENABLE ROW LEVEL SECURITY;

-- 4. ROW LEVEL SECURITY POLICIES

-- User Profiles Policies
CREATE POLICY "Allow select user_profiles for logged-in users"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow users to manage their own profiles"
  ON public.user_profiles FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- collect_data Policies
CREATE POLICY "Select collect_data based on role & branch"
  ON public.collect_data FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (user_profiles.role IN ('admin', 'cs') AND user_profiles.cabang = collect_data.cabang)
      )
    )
  );

CREATE POLICY "Insert collect_data for Admin"
  ON public.collect_data FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.cabang = collect_data.cabang
    )
  );

-- verifikasi_kartu Policies
CREATE POLICY "Select verifikasi_kartu based on role & branch"
  ON public.verifikasi_kartu FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (
          user_profiles.role IN ('admin', 'cs')
          AND EXISTS (
            SELECT 1 FROM public.collect_data
            WHERE collect_data.transaksi_id = verifikasi_kartu.transaksi_id
            AND collect_data.cabang = user_profiles.cabang
          )
        )
      )
    )
  );

CREATE POLICY "Insert verifikasi_kartu for CS"
  ON public.verifikasi_kartu FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      JOIN public.collect_data ON collect_data.transaksi_id = verifikasi_kartu.transaksi_id
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'cs'
      AND collect_data.cabang = user_profiles.cabang
    )
  );

-- konfirmasi_beli Policies
CREATE POLICY "Select konfirmasi_beli based on role & branch"
  ON public.konfirmasi_beli FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (
          user_profiles.role IN ('admin', 'cs')
          AND EXISTS (
            SELECT 1 FROM public.verifikasi_kartu vk
            JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
            WHERE vk.verifikasi_id = konfirmasi_beli.verifikasi_id
            AND cd.cabang = user_profiles.cabang
          )
        )
      )
    )
  );

CREATE POLICY "Insert konfirmasi_beli for Admin"
  ON public.konfirmasi_beli FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = konfirmasi_beli.verifikasi_id
      JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
      AND cd.cabang = user_profiles.cabang
    )
  );

-- aktual Policies
CREATE POLICY "Select aktual based on role & branch"
  ON public.aktual FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (
          user_profiles.role IN ('admin', 'cs')
          AND EXISTS (
            SELECT 1 FROM public.konfirmasi_beli kb
            JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
            JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
            WHERE kb.konfirmasi_id = aktual.konfirmasi_id
            AND cd.cabang = user_profiles.cabang
          )
        )
      )
    )
  );

CREATE POLICY "Insert aktual for Keuangan"
  ON public.aktual FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'keuangan'
    )
  );

-- bayar_silang Policies
CREATE POLICY "Select bayar_silang based on role & branch"
  ON public.bayar_silang FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (
          user_profiles.role IN ('admin', 'cs')
          AND EXISTS (
            SELECT 1 FROM public.konfirmasi_beli kb
            JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
            JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
            WHERE kb.konfirmasi_id = bayar_silang.konfirmasi_id
            AND cd.cabang = user_profiles.cabang
          )
        )
      )
    )
  );

CREATE POLICY "Insert bayar_silang for Keuangan"
  ON public.bayar_silang FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'keuangan'
    )
  );

-- pra_produksi Policies
CREATE POLICY "Select pra_produksi based on role & branch"
  ON public.pra_produksi FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (
          user_profiles.role IN ('admin', 'cs')
          AND EXISTS (
            SELECT 1 FROM public.konfirmasi_beli kb
            JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
            JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
            WHERE kb.konfirmasi_id = pra_produksi.konfirmasi_id
            AND cd.cabang = user_profiles.cabang
          )
        )
      )
    )
  );

CREATE POLICY "Insert pra_produksi for Gudang"
  ON public.pra_produksi FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'gudang'
    )
  );

-- post_produksi Policies
CREATE POLICY "Select post_produksi based on role & branch"
  ON public.post_produksi FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.role IN ('keuangan', 'gudang')
        OR
        (
          user_profiles.role IN ('admin', 'cs')
          AND EXISTS (
            SELECT 1 FROM public.pra_produksi pp
            JOIN public.konfirmasi_beli kb ON kb.konfirmasi_id = pp.konfirmasi_id
            JOIN public.verifikasi_kartu vk ON vk.verifikasi_id = kb.verifikasi_id
            JOIN public.collect_data cd ON cd.transaksi_id = vk.transaksi_id
            WHERE pp.pra_id = post_produksi.pra_id
            AND cd.cabang = user_profiles.cabang
          )
        )
      )
    )
  );

CREATE POLICY "Insert post_produksi for Gudang"
  ON public.post_produksi FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'gudang'
    )
  );
