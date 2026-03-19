var express = require('express');
var router = express.Router();
let slugify = require('slugify');
let productModel = require('../schemas/products');
let inventoryModel = require('../schemas/inventories');

/* GET ALL PRODUCTS */
router.get('/', async function (req, res, next) {
    let queries = req.query;
    // Chấp nhận tìm kiếm cả theo name hoặc title
    let keyword = queries.name || queries.title || '';
    let max = queries.max ? queries.max : 100000000;
    let min = queries.min ? queries.min : 0;
    
    let data = await productModel.find({
        isDeleted: false,
        $or: [
            { name: new RegExp(keyword, 'i') },
            { title: new RegExp(keyword, 'i') }
        ],
        price: { $gte: min, $lte: max }
    }).populate({
        path: 'category',
        select: 'name'
    });
    res.send(data);
});

/* CREATE PRODUCT - CHẤP NHẬN CẢ NAME VÀ TITLE */
router.post('/', async function (req, res) {
    try {
        // Lấy giá trị từ Postman (ưu tiên title, nếu không có thì lấy name)
        const displayTitle = req.body.title || req.body.name;

        if (!displayTitle) {
            return res.status(400).send({ message: "Trường 'title' hoặc 'name' là bắt buộc" });
        }

        // Tạo object data linh hoạt để khớp với Schema
        let productData = {
            title: displayTitle, // Gán cho title (vì schema yêu cầu title)
            name: displayTitle,  // Gán cho name (để dự phòng)
            slug: slugify(displayTitle, {
                replacement: '-',
                lower: true,
                strict: true
            }),
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            images: req.body.images
        };

        let newProduct = new productModel(productData);
        await newProduct.save();

        // Tự động tạo Inventory tương ứng
        try {
            await new inventoryModel({
                product: newProduct._id,
                stock: req.body.stock || 0,
                reserved: 0,
                soldCount: 0
            }).save();
        } catch (inventoryError) {
            await productModel.findByIdAndDelete(newProduct._id);
            return res.status(400).send({ message: "Lỗi tạo kho: " + inventoryError.message });
        }

        res.status(201).send(newProduct);
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

/* UPDATE PRODUCT */
router.put('/:id', async function (req, res) {
    try {
        let id = req.params.id;
        let updateData = req.body;
        
        let newName = updateData.title || updateData.name;
        if (newName) {
            updateData.slug = slugify(newName, { lower: true, strict: true });
        }

        let result = await productModel.findByIdAndUpdate(id, updateData, { new: true });
        res.send(result);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

module.exports = router;