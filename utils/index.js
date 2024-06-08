const getRandomHexString = (length) => {
    const characters = "0123456789abcdef";
    let hexString = "";
    for (let i = 0; i < length; i++) {
      hexString += characters[Math.floor(Math.random() * characters.length)];
    }
    return hexString;
};

module.exports = { getRandomHexString };