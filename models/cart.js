const fs = require('fs');
const path = require('path');

const p = path.join(
    path.dirname(process.mainModule.filename), 
    'data', 
    'cart.json'
);

module.exports = class Cart {
    //* Different approach
    // constructor() {
    //     this.products = [];
    //     this.totalPrice = 0;
    // }

    static addProduct(id, productPrice) {
        // 1. Fetch the previous cart
        fs.readFile(p, (err, fileContent) => {
            let cart = { products: [], totalPrice: 0 };

            if(!err) {
                cart = JSON.parse(fileContent);
            }
            
            // 2. Analyse the cart => Find existing product
            const existingProductIndex = cart.products.findIndex((prod) => prod.id === id);
            const existingProduct = cart.products[existingProductIndex]
            let updatedProduct;

            // 3. Add new product/ increase quantity
            if(existingProduct) {
                updatedProduct = { ...existingProduct };
                updatedProduct.qty += 1;
                // Copy the old one
                cart.products = [...cart.products];
                // Replace old one and add the new one (qty)
                cart.products[existingProductIndex] = updatedProduct;
            } else {
                updatedProduct = { id: id, qty: 1 }
                cart.products = [...cart.products, updatedProduct];
            }
            // Like 023.99 -> 23.99
            cart.totalPrice += +productPrice;
            fs.writeFile(p, JSON.stringify(cart), (err) => {
                console.log(err);
            });
        });

        //* Alternative Solution
        // fs.readFile(p, (err, fileContent) => {
        //     let cart = { products: [], totalPrice: 0 };
        //     if (!err) {
        //       cart = JSON.parse(fileContent);
        //     }
        //     const exisitingProdIndex = cart.products.findIndex((prodId) => prodId.id === id);
        //     if (exisitingProdIndex !== -1) {
        //       cart.products[exisitingProdIndex].qty += 1;
        //     } else {
        //       cart.products.push({ id, qty: 1 });
        //     }
        //     cart.totalPrice += +price;
        //     fs.writeFile(p, JSON.stringify(cart), (err) => {
        //       console.log(err);
        //     });
        // });
    }

    static deleteProduct(id, prodPrice) {
        fs.readFile(p, (err, fileContent) => {
            if(err) {
                return;
            }

            // JSON -> String
            const updatedCart = { ...JSON.parse(fileContent) };
            const product = updatedCart.products.find((prod) => prod.id === id);
            if(product == null) {
                return console.log("Product not in Cart!");
            }

            const prodQty = product.qty;
            updatedCart.products = updatedCart.products.filter((prod) => prod.id !== id);
            updatedCart.totalPrice = updatedCart.totalPrice - prodPrice * prodQty;

            fs.writeFile(p, JSON.stringify(updatedCart), (err) => {
                console.log(err);
            });
        });
    }

    static getCart(cb) {
        fs.readFile(p, (err, fileContent) => {
            const cart = JSON.parse(fileContent);
            if(err) {
                return cb({});
            } else {
                cb(cart);
            }
        });
    }
};