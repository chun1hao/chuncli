const semver = require('semver');

module.exports = function (minVersion) {
  const curVersion = semver.valid(semver.coerce(process.version));
  return semver.satisfies(curVersion, '>=' + minVersion);
};
