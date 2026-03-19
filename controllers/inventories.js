const Inventory = require('../schemas/inventories');

const getAll = async (req, res, next) => {
  try {
    const data = await Inventory.find().populate('product');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Inventory.findById(id).populate('product');
    if (!data) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addStock = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const inventory = await Inventory.findOne({ product });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    inventory.stock += quantity;
    await inventory.save();
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeStock = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const inventory = await Inventory.findOne({ product });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    if (inventory.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock' });
    }
    inventory.stock -= quantity;
    await inventory.save();
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reservation = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const inventory = await Inventory.findOne({ product });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    if (inventory.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock for reservation' });
    }
    inventory.stock -= quantity;
    inventory.reserved += quantity;
    await inventory.save();
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sold = async (req, res, next) => {
  try {
    const { product, quantity } = req.body;
    const inventory = await Inventory.findOne({ product });
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    if (inventory.reserved < quantity) {
        return res.status(400).json({ message: 'Not enough reserved items to be sold' });
    }
    inventory.reserved -= quantity;
    inventory.soldCount += quantity;
    await inventory.save();
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  addStock,
  removeStock,
  reservation,
  sold,
};
