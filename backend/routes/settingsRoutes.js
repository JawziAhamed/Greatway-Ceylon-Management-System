const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadSignature,
  removeSignature,
} = require('../controllers/settingsController');
const upload = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getSettings).put(adminOnly, updateSettings);
router.post('/logo', adminOnly, upload.single('logo'), uploadLogo);
router.post('/signature', adminOnly, upload.single('signature'), uploadSignature);
router.delete('/signature', adminOnly, removeSignature);

module.exports = router;
