const express = require('express');
const mongoose = require('mongoose');
const Device = require('../models/Device');

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function handleError(err, res) {
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Dữ liệu hoặc ID không hợp lệ' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Mã thiết bị (deviceId) đã tồn tại' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Lỗi máy chủ hoặc lỗi kết nối cơ sở dữ liệu' });
}

function checkId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID thiết bị không hợp lệ' });
  }
  next();
}

// GET /api/devices  và  GET /api/devices?search=projector
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search && search.trim()) {
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      filter = {
        $or: [{ deviceId: regex }, { name: regex }, { deviceType: regex }, { room: regex }],
      };
    }
    const devices = await Device.find(filter).sort({ createdAt: -1 });
    res.json(devices);
  } catch (err) {
    handleError(err, res);
  }
});

// GET /api/devices/:id
router.get('/:id', checkId, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json(device);
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/devices
router.post('/', async (req, res) => {
  try {
    const device = await Device.create(req.body);
    res.status(201).json(device);
  } catch (err) {
    handleError(err, res);
  }
});

// PUT /api/devices/:id
router.put('/:id', checkId, async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json(device);
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/devices/:id
router.delete('/:id', checkId, async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json({ message: 'Đã xóa thiết bị', id: req.params.id });
  } catch (err) {
    handleError(err, res);
  }
});

module.exports = router;