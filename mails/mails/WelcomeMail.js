const Button = require('../components/Button');
const ContentBlock = require('../components/ContentBlock');
const Text = require('../components/Text');

const WelcomeMailContent = () => `
${ContentBlock(
  `${Text(
    '',
  )}`,
)}
${Button('Play now!', '')}
${ContentBlock(`${Text('Enjoy playing on our platform!')}`)}
`;

module.exports = WelcomeMailContent;
