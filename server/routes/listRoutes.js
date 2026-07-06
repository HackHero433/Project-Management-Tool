import express from 'express';
import { body } from 'express-validator';
import { createTask } from '../controllers/taskController.js';
import { deleteList, updateList } from '../controllers/listController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.put('/:id', updateList);
router.delete('/:id', deleteList);
router.post('/:id/tasks', [body('title').trim().notEmpty().withMessage('Task title is required')], validate, createTask);

export default router;
