const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1];
    // console.log(req.session.isLoggedIn);
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/login', { 
        pageTitle: 'Login', 
        path: '/login',
        errorMessage: message,
        oldInput: '',
        validErrors: []
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', { 
        pageTitle: 'Signup', 
        path: '/signup',
        errorMessage: message,
        oldInput: { email: '' },
        validErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie', 'loggedIn=true');
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    //* Validation
    if(!errors.isEmpty()) {
        // req.flash('error', 'Invalid Email or Password!');
        // return res.redirect('/login');
        return res.status(422).render('auth/login', { 
            pageTitle: 'Login', 
            path: '/login',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email },
            validErrors: errors.array()
        });;
    }

    User.findOne({ email: email })
        .then(user => {
            if(!user) {
                // req.flash('error', 'Invalid Email or Password!');
                // return res.redirect('/login');
                return res.status(422).render('auth/login', { 
                    pageTitle: 'Login', 
                    path: '/login',
                    errorMessage: 'Invalid Email or Password!',
                    oldInput: { email: email },
                    validErrors: []
                });;
            }
            
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if(doMatch) {
                        req.session.isLoggedIn = true;        
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', { 
                        pageTitle: 'Login', 
                        path: '/login',
                        errorMessage: 'Invalid Email or Password!',
                        oldInput: { email: email },
                        validErrors: []
                    });;
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('login');
                });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).render('auth/signup', { 
            pageTitle: 'Signup', 
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email },
            validErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(userDoc => {
            if(userDoc) {
                req.flash('error', 'Account Existed!');
                return res.redirect('/signup');
            }

            return bcrypt.hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({
                        email: email,
                        password: hashedPassword,
                        cart: { items: [] }
                    });
        
                    return user.save();
                })
                .then(result => {
                    return res.redirect('/login');
                    //* Temporarily not working
                    // return transporter.sendMail({
                    //     to: email,
                    //     from: 'wulaiyin789@yahoo.com.hk',
                    //     subject: 'Signup succeeded!',
                    //     html: '<h1>Sign Up successfully!</h1>'
                    // });
                })
                .catch(err => {
                    console.log(err);
                    
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};

//* Click 'Reset Password'
exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/reset', { 
        pageTitle: 'Reset Password', 
        path: '/reset',
        errorMessage: message
    });
};

//* Render to the page needs to type email
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }

        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if(!user) {
                    req.flash('error', 'No Account Found');
                    return res.redirect('/reset');
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 360000;
                return user.save();
            })
            .then(result => {
                return res.redirect('/');
                //* Temporarily not working
                // return transporter.sendMail({
                //     to: req.body.email,
                //     from: 'wulaiyin789@yahoo.com.hk',
                //     subject: 'Password Reset',
                //     html: `
                //         <h1>You requested a password reset.</h1>
                //         <p>Click this <a href="http://localhost:3000/reset/${token}>link</a>to set a new password.</p>
                //     `
                // });
            })
            .catch(err => {
                console.log(err);
                
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
            });
    })
};

//* Render to the page that reset the password
exports.getResetPassword = (req, res, next) => {
    const token = req.params.token;

    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if(message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }

            res.render('auth/reset-pass', { 
                pageTitle: 'Reset New Password', 
                path: '/reset-pass',
                errorMessage: message,
                passwordToken: token,
                userId: user._id.toString()
            });
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

//* Reset password behind the sense and render back to login page
exports.postResetPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({ 
        resetToken: passwordToken, 
        resetTokenExpiration: { $gt: Date.now() }, 
        _id: userId 
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);
        })
        .then(hashPassowrd => {
            resetUser.password = hashPassowrd;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;

            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
            
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
};