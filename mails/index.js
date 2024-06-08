const MainLayout = require('./layout/MainLayout');
const WelcomeMailContent = require('./mails/WelcomeMail');

const WelcomeMail = (username = '{{nickname}}') => ({
  id: 1,
  name: '001 | Registration Welcome',
  subject: '',
  text: ((username) =>
    `Hi ${username}!\n\n
    `)(username),
  html: ((username) =>
    `${MainLayout(
      '',
      username,
      WelcomeMailContent(),
    )}`)(username),
});

module.exports = {
  WelcomeMail,
};
