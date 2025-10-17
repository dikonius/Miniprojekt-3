import { Router } from 'express';
import { loginUser } from '../controllers/loginController.js';
import { registerUser } from '../controllers/registerController.js';
import { getSecret } from '../controllers/secretController.js';
import { updateUser } from '../controllers/updateUserController.js'
import { deleteUser } from '../controllers/deleteUserController.js';
import { getAllUsers } from '../controllers/getAllUsersController.js';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/secret', getSecret);
router.patch('/user', updateUser);
router.delete('/delete', deleteUser);

// Admin-only route
router.get('/users', getAllUsers);

export default router;
