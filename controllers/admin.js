const Product = require('../models/product');

const { validationResult } = require('express-validator/check');

exports.getAddProduct = (req, res, next) => {
    // if(!req.session.isLoggedIn) {
    //     return res.redirect('/login');
    // }

    res.render('admin/edit-product', { 
        pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false,
        errorMessage: null,
        hasError: false,
        validErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);
    
    if(!errors.isEmpty()) {
        // req.flash('error', 'Invalid Email or Password!');
        // return res.redirect('/login');
        return res.status(422).render('admin/edit-product', { 
            pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title, 
                imageUrl: imageUrl, 
                price: price, 
                description: description 
            },
            errorMessage: errors.array()[0].msg,
            validErrors: errors.array()
        });
    }

    const product = new Product({ 
        title: title, 
        price: price, 
        description: description, 
        imageUrl: imageUrl,
        userId: req.user
    });
    product.save()
        .then(result => {
            // console.log(result);
            console.log('ADDED PRODUCT!');
            req.flash('success', `New Product has been added`);
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);

            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
            // return res.status(500).render('admin/edit-product', { 
            //     pageTitle: 'Add Product', 
            //     path: '/admin/add-product',
            //     editing: false,
            //     hasError: true,
            //     product: {
            //         title: title, 
            //         imageUrl: imageUrl, 
            //         price: price, 
            //         description: description 
            //     },
            //     errorMessage: 'Database Operation Failed. Please contact the admin',
            //     validErrors: []
            // });
        });;
};

exports.getEditProduct = (req, res, next) => {
    // Query Params
    const editMode = req.query.edit;
    if(!editMode) {
        res.redirect('/');
    }
    
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if(!product) {
                return res.redirect('/');
            }
    
            res.render('admin/edit-product', { 
                pageTitle: 'Edit Product', 
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validErrors: []
            });
        })
        .catch(err => {
            console.log(err);

            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDesc = req.body.description;
    const errors = validationResult(req);
    
    if(!errors.isEmpty()) {
        // req.flash('error', 'Invalid Email or Password!');
        // return res.redirect('/login');
        return res.status(422).render('admin/edit-product', { 
            pageTitle: 'Add Product', 
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle, 
                imageUrl: updatedImageUrl, 
                price: updatedPrice, 
                description: updatedDesc,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validErrors: errors.array()
        });
    }
    
    Product.findById(prodId)
        .then(product => {
            if(product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.imageUrl = updatedImageUrl;
            product.description = updatedDesc;

            return product.save()
                .then(result => {
                    console.log('UPDATED PRODUCT');
                    req.flash('success', `Product (${product.title}) has been updated`);
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    let message = req.flash('success');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    Product.find({ userId: req.user._id })
        .then(products => {
            res.render('admin/products', { 
                prods: products, 
                pageTitle: 'Admin Products', 
                path: '/admin/products',
                message: message
            });
        })
        .catch((err) => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    Product.deleteOne({ _id: prodId, userId: req.user._id })
        .then(() => {
            console.log('DELETED PRODUCT!')
            req.flash('success', `Product #${prodId} has been deleted`);
            res.redirect('/admin/products');
        })
        .catch((err) => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};