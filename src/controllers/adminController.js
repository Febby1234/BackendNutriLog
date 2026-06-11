import { query } from '../config/database.js';

export const getPendingProposals = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT proposal_id, proposed_food_name, proposed_calories, protein_g, fat_g, carbs_g, status, submitted_by FROM food_proposals WHERE status = 'PENDING' ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Get pending proposals error:', error);
    next(error);
  }
};

export const approveProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    // 1. Cari data usulannya terlebih dahulu
    const proposalRes = await query('SELECT * FROM food_proposals WHERE proposal_id = $1', [proposalId]);
    if (proposalRes.rows.length === 0) {
      return res.status(404).json({ message: 'Data usulan tidak ditemukan' });
    }

    const prop = proposalRes.rows[0];

    // 2. Ubah status usulan menjadi APPROVED
    await query("UPDATE food_proposals SET status = 'APPROVED' WHERE proposal_id = $1", [proposalId]);

    // 3. Pindahkan data gizi lengkap secara otomatis ke tabel utama 'foods' agar bisa dipakai massal
    await query(
      'INSERT INTO foods (name, calories_per_serving, protein_g, fat_g, carbs_g, is_approved) VALUES ($1, $2, $3, $4, $5, true)',
      [prop.proposed_food_name, prop.proposed_calories, prop.protein_g, prop.fat_g, prop.carbs_g]
    );

    res.status(200).json({ message: 'Usulan makanan berhasil disetujui dan masuk ke database utama!' });
  } catch (error) {
    console.error('Approve proposal error:', error);
    next(error);
  }
};

export const rejectProposal = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    const result = await query("UPDATE food_proposals SET status = 'REJECTED' WHERE proposal_id = $1 RETURNING *", [proposalId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Data usulan tidak ditemukan' });
    }

    res.status(200).json({ message: 'Usulan makanan berhasil ditolak.' });
  } catch (error) {
    console.error('Reject proposal error:', error);
    next(error);
  }
};

export default { getPendingProposals, approveProposal, rejectProposal };