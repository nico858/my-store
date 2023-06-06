import express from 'express';

import CategoryService from './../services/category.service.js';
import validatorHanlder from './../middlewares/validator.handler.js';
import { getCategorySchema, createCategorySchema, updateCategorySchema } from './../schemas/category.schema.js';

const router = express.Router();
const service = new CategoryService();

router.get('/', async (req, res, next) => {
  try {
    const categories = await service.find();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

router.get('/:id',
  validatorHanlder(getCategorySchema, 'params'), async (req, res, next) => {
    try {
      const { id } = req.params;
      const category = await service.findOne(id);
      res.json(category);
    } catch (error) {
      next(error);
    }
});

router.post('/',
  validatorHanlder(createCategorySchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newCategory = await service.create(body);
      res.status(201).json(newCategory);
    } catch (error) {
      next(error);
    }
});

router.patch('/:id',
  validatorHanlder(getCategorySchema, 'params'),
  validatorHanlder(updateCategorySchema, 'body'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const updatedCategory = await service.update(id, body);
      res.json(updatedCategory);
    } catch (error) {
      next(error);
    }
});

router.delete('/:id',
  validatorHanlder(getCategorySchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedCategory = await service.delete(id);
      res.json(deletedCategory);
    } catch (error) {
      next(error);
    }
});

export default router;
