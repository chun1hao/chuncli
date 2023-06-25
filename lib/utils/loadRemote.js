const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const download = require('download-git-repo');

const pk = require('../../package.json');

module.exports = async (name, clone = false) => {
  const tempdir = path.resolve(os.tmpdir(), pk.name);
  if (clone) {
    await fs.remove(tempdir);
  }

  return new Promise((resolve, reject) => {
    download(name, tempdir, { clone: false }, (err) => {
      if (err) return reject(err);
      resolve(tempdir);
    });
  });
};
