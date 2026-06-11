import express from 'express';
import authenticateToken from '../middleware/auth.js';
import { getPendingProposals, approveProposal, rejectProposal } from '../controllers/adminController.js';

const router = express.Router();

// Semua rute di bawah ini wajib membawa token login
router.use(authenticateToken);

router.get('/proposals/pending', getPendingProposals);
router.post('/proposals/:proposalId/approve', approveProposal);
router.post('/proposals/:proposalId/reject', rejectProposal);

export default router;