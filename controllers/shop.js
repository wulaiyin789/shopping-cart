const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 3;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;

    Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then(products => {
            Product.countDocuments()
                .then(totalProds => {
                    const pagesCount = Math.ceil(totalProds / ITEMS_PER_PAGE);

                    return {
                        totalPages: pagesCount,
                        currPage: page,
                        hasPrev: page > 1,
                        hasNext: page < pagesCount
                    };
                })
                .then(pagingData => {
                    res.render('shop/index', { 
                        prods: products, 
                        pageTitle: 'All Products', 
                        path: '/products',
                        pagination: pagingData
                    });
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
    const page = +req.query.page || 1;

    Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        .then(products => {
            Product.countDocuments()
                .then(totalProds => {
                    const pagesCount = Math.ceil(totalProds / ITEMS_PER_PAGE);

                    return {
                        totalPages: pagesCount,
                        currPage: page,
                        hasPrev: page > 1,
                        hasNext: page < pagesCount
                    };
                })
                .then(pagingData => {
                    res.render('shop/index', { 
                        prods: products, 
                        pageTitle: 'Shop', 
                        path: '/',
                        pagination: pagingData
                    });
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