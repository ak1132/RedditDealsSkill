module.exports = {
  en: {
    translation: {
      WELCOME_MSG: `Welcome {{name}}, you can say whats the latest deal on sneakers? Would you like to try? $t(PERMISSION_MSG)`,
      WELCOME_BACK_MSG: `<say-as interpret-as="interjection">Welcome back, {{name}}!</say-as> now lets hear some deals shall we!`,
      DOUBT_SPEECHCON: `<say-as interpret-as="interjection">Sorry</say-as>`,
      HELLO_MSG: `Hi {{name}}, this is Reddit Dealer, how you doing?`,
      GOODBYE_MSG: `Thank you {{name}}, Goodbye`,
      FALLBACK_MSG: `Sorry {{name}}, didnt understand you, can you try again?`,
      NO_MSG: `Sorry {{name}}, this is an invalid response. Can you try one of the valid responses like, get me the latest sneaker deal?`,
      HELP_MSG: `Try saying something like whats the latest sneaker deal? I also support male and female fashion, steam, and game deals`,
      ERROR_MSG: `$t(DOUBT_SPEECHCON), there seems to be an error, can you try again`,
      REPROMPT_MSG: `Do you want to hear some deals? If Yes, ask me some deals.`,
      RESPONSE_MSG: `Hey {{name}}, here are the latest {{dealtype}} deals. `,
      UNSUPPORTED_MSG: `This is not one of the supported deals, supported ones are male and female 
      fashion, sneaker, steam and game deals. Could you please try one of them?`,
      PERMISSION_MSG : `Also, if you'd like to personalize the responses, please give me the permission to your first name under skill settings in your Amazon Alexa app. If you already have, great!!`,
    },
  },
};
