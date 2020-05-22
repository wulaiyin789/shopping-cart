const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/product-list', { 
                prods: products, 
                pageTitle: 'All Products', 
                path: '/products'
            });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    Product.findById(prodId)
        // .populate('userId');
        .then(product => {
            res.render('shop/product-detail', {
                pageTitle: product.title,
                path: '/products',
                product: product
            });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
}

exports.getIndex = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/index', { 
                prods: products, 
                pageTitle: 'Shop', 
                path: '/'
            });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    let message = req.flash('success');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            // console.log(products);
            res.render('shop/cart', { 
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
                message: message
            });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    let productDetail;

    Product.findById(prodId)
        .then(product => {
            productDetail = product;
            return req.user.addToCart(product);
        })
        .then(result => {
            // console.log(result);
            req.flash('success', `Product (${productDetail.title}) has been added to your Cart`);
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteCart = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.deleteCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } };
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });

            return order.save();
        })
        .then(result => {
            return req.user.clearCart();
        })
        .then(result => {
            req.flash('success', `New Order has been added`);
            res.redirect('/orders');
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    let message = req.flash('success');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            // console.log(orders);
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
                message: message
            });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteOrder = (req, res, next) => {
    const orderId = req.body.orderId;

    Order.deleteOne({ _id: orderId, 'user.userId': req.user._id })
        .then(() => {
            console.log('DELETED ORDER!');
            req.flash('success', `Order #${orderId} deleted successfully`);
            res.redirect('/orders');
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};