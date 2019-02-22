const express = require('express');

const router = express.Router();

const {
  comparePasswords,
  findByUsername,
  findById,
} = require('./users');

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
 * Ósamstilltur route handler fyrir umsóknarlista.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Lista af umsóknum
 */

async function login(req, res) {
  const data = {
    title: 'Innskráning',
    username: '',
    password: '',
    errors: [],
  };
  res.render('login', data);
}

/**
 * Ósamstilltur route handler sem vistar gögn í gagnagrunn og sendir
 * á þakkarsíðu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
async function formPost(req, res) {
  const {
    body: {
      username = '',
      password = '',
    } = {},
  } = req;

  const data = {
    username,
    password,
  };

  findByUsername(username).then(result => comparePasswords(password, result).then(console.log));

  return res.redirect('/login');
}

/**
 * Route handler fyrir þakkarsíðu.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 */
function thanks(req, res) {
  return res.render('thanks', { title: 'Takk fyrir umsóknina' });
}


router.get('/', login);
router.get('/thanks', thanks);

router.post(
  '/',
  catchErrors(formPost),
);

module.exports = router;
