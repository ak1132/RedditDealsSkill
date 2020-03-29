// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
"use strict";
const Alexa = require("ask-sdk-core");
const snoowrap = require("snoowrap");
const DynamoDbAdapter = require("ask-sdk-dynamodb-persistence-adapter");
const creds = require("../oauth_info.json");
const fs = require("fs");

const languageStrings = {
  en: {
    WELCOME_MSG:
      "Welcome, you can say what's the latest deal on sneakers? Would you like to try?",
    HELLO_MSG: "Hi, this is Reddit Dealer, how you doing?",
    GOODBYE_MSG: "Thank you for using me, Goodbye",
    FALLBACK_MSG: "Sorry, didn't understand you, can you try again?",
    HELP_MSG: "Hey, how can I help?",
    ERROR_MSG: "Sorry, there seems to be an error, Please try again",
    REGISTER_MSG: "Here are the latest {{dealtype}} deals"
  }
};

const Reddit = new snoowrap({
  userAgent: creds.user_agent,
  clientId: creds.client_id,
  clientSecret: creds.client_secret,
  refreshToken: creds.refresh_token
});

const getSubRedditDeals = async(dealType) => {
  const listOfPosts = await Reddit.getSubreddit(dealType).getTop();
  let deal = [];
  for (let i = 0; i < listOfPosts.length; i++){
    deal.push(listOfPosts[i].title);
  }
  return deal;
}

// Promise.resolve(getSubRedditDeals()).then(console.log);
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const speakOutput = languageStrings.en.WELCOME_MSG;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};


const GetDealsIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getRequestType(handlerInput.requestEnvelope).startsWith("GetDeals")
    );
  },
  handle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const intent = requestEnvelope.intent;
    
    if (intent.confirmationStatus === "CONFIRMED") {
      const dealType = Alexa.getSlotValue(requestEnvelope, 'dealtype');
      let deals = '';
      if (dealType.includes("sneaker")) {
        deals = getSubRedditDeals("SneakerDeals"); //need the array
      } else if (dealType.includes("frugal")) {
        deals = getSubRedditDeals("frugalmalefashion");
      }
    }

    return (
      handlerInput.responseBuilder
        .speak(languageStrings.en.HELLO_MSG)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  }
};


const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = languageStrings.en.HELP_MSG;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};


const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) ===
          "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    const speakOutput = languageStrings.en.GOODBYE_MSG;
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};


const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return (
      handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse()
    );
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = languageStrings.en.ERROR_MSG;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GetDealsIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
