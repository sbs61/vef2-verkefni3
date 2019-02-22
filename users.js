
/* todo útfæra virkni fyrir notendur */

const bcrypt = require('bcrypt');
const { selectUsers } = require('./db');

function getRecords() {
  return selectUsers();
}

async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);

  if (ok) {
    return user;
  }

  return false;
}

function findByUsername(username) {
  const found = getRecords()
    .then(records => records.find(u => u.username === username));

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

function findById(id) {
  const found = getRecords()
    .then(records => records.find(u => u.id === id));

  if (found) {
    return Promise.resolve(found);
  }

  return Promise.resolve(null);
}

module.exports = {
  comparePasswords,
  findByUsername,
  findById,
  getRecords,
};
