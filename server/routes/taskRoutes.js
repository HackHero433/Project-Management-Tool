import express from 'express';
import { body } from 'express-validator';
import { addComment, getComments } from '../controllers/commentController.js';
import { deleteTask, getTask, updateTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.get('/:id/comments', getComments);
router.post('/:id/comments', [body('text').trim().notEmpty().withMessage('Comment text is required')], validate, addComment);

export default router;
