const xss = require('xss');
const express = require('express');
const { check, validationResult } = require('express-validator/check');
const { sanitize } = require('express-validator/filter');

const router = express.Router();

const { insertUser, usernameAvailable } = require('./db');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálparfall sem XSS hreinsar reit í formi eftir heiti.
 *
 * @param {string} fieldName Heiti á reit
 * @returns {function} Middleware sem hreinsar reit ef hann finnst
 */
function sanitizeXss(fieldName) {
  return (req, res, next) => {
    if (!req.body) {
      next();
    }

    const field = req.body[fieldName];

    if (field) {
      req.body[fieldName] = xss(field);
    }

    next();
  };
}

// Fylki af öllum validations fyrir umsókn
const validations = [
  check('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),

  check('email')
    .isLength({ min: 1 })
    .withMessage('Netfang má ekki vera tómt'),

  check('email')
    .isEmail()
    .withMessage('Netfang verður að vera netfang'),

  check('username')
    .isLength({ min: 1 })
    .withMessage('Notendanafn má ekki vera tómt'),

  check('username')
    .custom(value => usernameAvailable(value).then(result => result))
    .withMessage('Notendanafn er nú þegar til'),

  check('password')
    .isLength({ min: 8 })
    .withMessage('Lykilorð verður að vera a.m.k. 8 stafir'),

  check('password2')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Lykilorð verða að vera eins'),

];

// Fylki af öllum hreinsunum fyrir umsókn
const sanitazions = [
  sanitize('name').trim().escape(),
  sanitizeXss('name'),

  sanitizeXss('email'),
  sanitize('email').trim().normalizeEmail(),

  sanitize('username').trim().escape(),
  sanitizeXss('username'),

  sanitize('password').trim().escape(),
  sanitizeXss('password'),

  sanitize('password2').trim().escape(),
  sanitizeXss('password2'),

];

/**
 * Ósamstilltur route handler fyrir umsóknarlista.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Lista af umsóknum
 */

async function register(req, res) {
  const data = {
    title: 'Nýskráning',
    name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    errors: [],
    loggedIn: req.isAuthenticated(),
    user: req.user,
    page: 'register',
  };
  res.render('register', data);
}

/**
 * Route handler sem athugar stöðu á umsókn og birtir villur ef einhverjar,
 * sendir annars áfram í næsta middleware.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Næsta middleware
 * @returns Næsta middleware ef í lagi, annars síðu með villum
 */
function showErrors(req, res, next) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      password2 = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    password2,
  };

  const validation = validationResult(req);
  data.loggedIn = req.isAuthenticated(); // er notandi skráður inn?
  data.title = 'Nýskráning - vandræði';
  data.page = 'register';
  if (!validation.isEmpty()) {
    const errors = validation.array();
    data.errors = errors;

    return res.render('register', data);
  }

  return next();
}

/**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og sendir
 * á þakkarsíðu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function registerPost(req, res) {
  const {
    body: {
      name = '',
      email = '',
      username = '',
      password = '',
      password2 = '',
    } = {},
  } = req;

  const data = {
    name,
    email,
    username,
    password,
    password2,
  };

  await insertUser(data);

  // nýskráning tókst, senda á login síðu
  return res.redirect('/login');
}

router.get('/', register);

router.post(
  '/',
  // Athugar hvort form sé í lagi
  validations,
  // Ef form er ekki í lagi, birtir upplýsingar um það
  showErrors,
  // Öll gögn í lagi, hreinsa þau
  sanitazions,
  // Senda gögn í gagnagrunn
  catchErrors(registerPost),
);

module.exports = router;
