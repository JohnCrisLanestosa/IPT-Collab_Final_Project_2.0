const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const isPasswordStrong = (password) => {
  if (typeof password !== "string") {
    return false;
  }

  return password.length >= 8 && SPECIAL_CHAR_REGEX.test(password);
};

module.exports = {
  isPasswordStrong,
};

