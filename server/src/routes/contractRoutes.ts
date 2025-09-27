import express from 'express';
import { 
  createContract, 
  getMyAllContracts, 
  getContract, 
  updateContract, 
  updateRecipientStatus,
  getReceivedContracts
} from '../controllers/contractController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All contract routes require authentication
router.use(authenticateToken);

// Contract CRUD operations
router.post('/', createContract); // Create new contract
router.get('/', getMyAllContracts); // Get all user's contracts
router.get('/received', getReceivedContracts); // Get contracts where user is a recipient
router.get('/:contractAddress', getContract); // Get specific contract
router.patch('/:contractAddress', updateContract); // Update contract

// Recipient status updates
router.patch('/:contractAddress/recipients/:recipientAddress', updateRecipientStatus);

export default router;
