const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', { 
        pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;

    // null -> Add New Product;  !null -> Edit Product (product.js (save))
    const product = new Product(null, title, imageUrl, price, description);
    product.save();
    res.redirect('/');
};

exports.getEditProduct = (req, res, next) => {
    // Query Params
    const editMode = req.query.edit;
    if(!editMode) {
        res.redirect('/');
    }
    
    const prodId = req.params.productId;
    Product.findById(prodId, (product) => {
        if(!product) {
            return res.redirect('/');
        }

        res.render('admin/edit-product', { 
            pageTitle: 'Add Product', 
            path: '/admin/edit-product',
            editing: editMode,
            product: product
        });
    });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;
    const updatedProduct = new Product(
        prodId, 
        updatedTitle, 
        updatedImageUrl, 
        updatedPrice, 
        updatedDesc
    );

    updatedProduct.save();
    res.redirect('/admin/products');
};

exports.getProducts = (req, res, next) => {
    Product.fetchAll((products) => {
        res.render('admin/products', { 
            prods: products, 
            pageTitle: 'Admin Products', 
            path: '/admin/products' 
        });
    });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    Product.delete(prodId);
    res.redirect('/admin/products');
};