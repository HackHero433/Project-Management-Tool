import express from 'express';
import { body } from 'express-validator';
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  inviteMember,
  removeMember,
  updateProject
} from '../controllers/projectController.js';
import { createList } from '../controllers/listController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);
router.get('/', getProjects);
router.post('/', [body('name').trim().notEmpty().withMessage('Project name is required')], validate, createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/invite', [body('email').isEmail().normalizeEmail(), body('role').optional().isIn(['admin', 'member'])], validate, inviteMember);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/lists', [body('title').trim().notEmpty().withMessage('List title is required')], validate, createList);

export default router;
