const CompanySettings = require('../models/CompanySettings');

// Helper to ensure singleton settings doc exists
const getOrCreateSettings = async () => {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = await CompanySettings.create({});
  }
  return settings;
};

// @desc    Get company settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update company settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  try {
    let settings = await getOrCreateSettings();

    // Deep merge or assign fields
    const updated = await CompanySettings.findByIdAndUpdate(settings._id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updated, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload company logo
// @route   POST /api/settings/logo
// @access  Private/Admin
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const settings = await getOrCreateSettings();
    settings.logoUrl = `/uploads/${req.file.filename}`;
    await settings.save();

    res.json({
      success: true,
      data: { logoUrl: settings.logoUrl },
      message: 'Company logo uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload signatory signature
// @route   POST /api/settings/signature
// @access  Private/Admin
const uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const settings = await getOrCreateSettings();
    settings.defaultSignatory.signatureImageUrl = `/uploads/${req.file.filename}`;
    await settings.save();

    res.json({
      success: true,
      data: { signatureImageUrl: settings.defaultSignatory.signatureImageUrl },
      message: 'Signature image uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadSignature,
};
