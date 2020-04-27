const fs = require('fs');
const path = require('path');

const Cart = require('./cart');

const p = path.join(
    path.dirname(process.mainModule.filename), 
    'data', 
    'products.json'
);

const getProductsFromFile = (cb) => {
    fs.readFile(p, (err, fileContent) => {
        if(err) {
            return cb([]);
        } else {
            cb(JSON.parse(fileContent));
        }
    });
};

module.exports = class Product {
    constructor(id, title, imageUrl, price, description) {
        this.id = id;
        this.title = title;
        this.imageUrl = imageUrl;
        this.price = price;
        this.description = description;
    }

    save() {
        getProductsFromFile((products) => {
            // For Existing product
            if(this.id) {
                const existingProdIndex = products.findIndex((prod) => prod.id === this.id);
                const updatedProd = [ ...products ];

                updatedProd[existingProdIndex] = this;
                fs.writeFile(p, JSON.stringify(updatedProd), (err) => {
                    console.log(err);
                });
            // For New product
            } else {
                this.id = Math.random().toString();
                products.push(this);
                fs.writeFile(p, JSON.stringify(products), (err) => {
                    console.log(err);
                });
            }
        });
    }

    static delete(id) {
        getProductsFromFile((products) => {
            const product = products.find((prod) => prod.id === id);
            const updatedProduct = products.filter((prod) => prod.id !== id);
            fs.writeFile(p, JSON.stringify(updatedProduct), (err) => {
                if(!err) {
                    Cart.deleteProduct(id, product.price);
                }
            });
        });
    }

    static fetchAll(cb) {
        getProductsFromFile(cb);
    }

    static findById(id, cb) {
        getProductsFromFile((products) => {
            const product = products.find((p) => p.id === id);
            cb(product);
        });
    }
}