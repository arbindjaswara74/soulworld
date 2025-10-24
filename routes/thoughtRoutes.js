const express = require('express');
const router = express.Router();
const { createThought, getThoughts, deleteThought } = require('../controllers/thoughtController');

router.route('/').post(createThought).get(getThoughts);
router.route('/:id').delete(deleteThought);

module.exports = router;
