const express = require('express');

const { selectUsers, updateUser, resetAdmins } = require('./db');

const router = express.Router();

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
async function applications(req, res) {
  const list = await selectUsers();

  const loggedIn = req.isAuthenticated();

  if (!loggedIn) { return res.redirect('/login'); }

  let isAdmin = false;
  if (loggedIn) {
    isAdmin = req.user.admin;
  }

  const data = {
    title: 'Notendur',
    list,
    loggedIn,
    isAdmin,
    page: 'admin',
  };


  return res.render('admin', data);
}

/**
 * Ósamstilltur route handler sem vinnur úr umsókn.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns Redirect á `/applications`
 */
async function processUsers(req, res) {
  const { update } = req.body;

  await resetAdmins();

  await update.forEach((id) => {
    updateUser(id);
  });

  // await updateUser(update);

  return res.redirect('/admin');
}

router.get('/', catchErrors(applications));
router.post('/process', catchErrors(processUsers));

module.exports = router;
