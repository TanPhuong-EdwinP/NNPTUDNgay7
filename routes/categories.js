var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let categoryModel = require('../schemas/categories');

/* 1. GET ALL CATEGORIES */
router.get('/', async function (req, res, next) {
  let data = await categoryModel.find({
    isDeleted: false
  });
  res.send(data);
});

/* 2. GET CATEGORY BY ID */
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findOne({ // Dùng findOne sẽ trả về object thay vì array
      isDeleted: false,
      _id: id
    });
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

/* 3. CREATE CATEGORY (FIXED SLUGIFY ERROR) */
router.post('/', async function (req, res) {
  try {
    const name = req.body.name;

    // KIỂM TRA DỮ LIỆU ĐẦU VÀO
    if (!name || typeof name !== 'string') {
      return res.status(400).send({ 
        message: "Trường 'name' là bắt buộc và phải là chuỗi văn bản." 
      });
    }

    let newCate = new categoryModel({
      name: name,
      slug: slugify(name, {
        replacement: '-',
        lower: true,
        strict: true
      }),
      image: req.body.image
    });

    await newCate.save();
    res.status(201).send(newCate);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

/* 4. UPDATE CATEGORY */
router.put('/:id', async function (req, res) {
  try {
    let id = req.params.id;
    
    // Nếu trong body có name, cập nhật luôn slug
    if (req.body.name) {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    let result = await categoryModel.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

/* 5. DELETE CATEGORY (SOFT DELETE) */
router.delete('/:id', async function (req, res) {
  try {
    let id = req.params.id;
    let result = await categoryModel.findByIdAndUpdate(
      id, 
      { isDeleted: true }, 
      { new: true }
    );
    
    if (result) {
      res.send({ message: "Xóa thành công", data: result });
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;