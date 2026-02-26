const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const authMiddleware = require('../middleware/authMiddleware');
const { updateRates } = require("../controllers/inventoryController");

router.use(authMiddleware);


const toNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};


router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      CODE,
      PROFILE,
      DESCRIPTION,
      HSN_CODE,
      RATE,
      LENGT_PACKT,
      WEIGHT_KG_M,
      PROFILE_LEGT
    } = req.body;

    const rate = toNum(RATE);
    const packLength = toNum(LENGT_PACKT);
    const weight = toNum(WEIGHT_KG_M);
    const profileLength = toNum(PROFILE_LEGT);

    if (
      !CODE ||
      !PROFILE ||
      !DESCRIPTION ||
      !HSN_CODE ||
      rate <= 0 ||
      packLength <= 0 ||
      weight <= 0 ||
      profileLength <= 0
    ) {
      return res.status(400).json({
        error: "All fields are required and numeric fields must be greater than 0"
      });
    }

    const qty = toNum(req.body.QTY);
    const packs = toNum(req.body.PACKS);
    const lengths = toNum(req.body.LENGTHS);
    const amount = toNum(req.body.AMOUNT);


    const result = await Item.updateOne(
      { userId, CODE }, 
      {
        $set: {
          PROFILE,
          DESCRIPTION,
          HSN_CODE,
          RATE: rate,
          LENGT_PACKT: packLength,
          WEIGHT_KG_M: weight,
          PROFILE_LEGT: profileLength
        },
        $inc: {
          QTY: qty,
          PACKS: packs,
          LENGTHS: lengths,
          AMOUNT: amount
        }
      },
      { upsert: true }
    );


    await Item.updateOne(
      { PROFILE: "TOTAL", userId },
      {
        $setOnInsert: { PROFILE: "TOTAL", userId },
        $inc: {
          QTY: qty,
          PACKS: packs,
          LENGTHS: lengths,
          AMOUNT: amount
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount === 1) {
      return res.json({ message: "Item added successfully" });
    } else {
      return res.json({ message: "Item updated successfully" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Failed to create/update item',
      details: err.message
    });
  }
});


router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await Item.find({ userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});



router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;

    const item = await Item.findOne({ _id: req.params.id, userId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

   
    const qty = parseFloat(item.QTY) || 0;
    const packs = parseFloat(item.PACKS) || 0;
    const lengths = parseFloat(item.LENGTHS) || 0;
    const amount = parseFloat(item.AMOUNT) || 0;

    
    await Item.updateOne(
      { PROFILE: "TOTAL", userId },
      {
        $inc: {
          QTY: -qty,
          PACKS: -packs,
          LENGTHS: -lengths,
          AMOUNT: -amount
        }
      }
    );

    await item.deleteOne();

    res.json({ message: 'Item deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});


router.put("/update-rate", updateRates);
module.exports = router;