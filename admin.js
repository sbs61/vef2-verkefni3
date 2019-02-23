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
 * Ósamstilltur route handler fyrir admin síðuna.
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {string} Lista af umsóknum
 */
async function admin(req, res) {
  const list = await selectUsers(); // sæki alla notendur

  const loggedIn = req.isAuthenticated(); // segir hvort að einhver sé skráður inn eða ekki

  if (!loggedIn) { return res.redirect('/login'); } // ef ekki skráður inn, redirect á login síðu

  let isAdmin = false;
  if (loggedIn) {
    isAdmin = req.user.admin; // athuga hvort notandi sé admin eða ekki
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
  // sæki stöðu checkboxa, fylki af id-um hjá þeim sem eiga að fá admin rétt
  const { update } = req.body;

  await resetAdmins(); // tek burt admin rétt hjá öllum notendum

  await update.forEach((id) => {
    updateUser(id); // bæti við admin rétt samkvæmt stöðu checkboxa í update fylkinu fyrir hvert id
  });

  return res.redirect('/admin');
}

router.get('/', catchErrors(admin));
router.post('/process', catchErrors(processUsers));

module.exports = router;
