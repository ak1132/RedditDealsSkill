// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
"use strict";
const Alexa = require("ask-sdk-core");
const snoowrap = require("snoowrap");
const creds = require("../oauth_info.json");
const constants = require("./constants");

// -------------------------------------------------------------------------------------

const getPersistenceAdapter = tableName => {
  const isAlexaHosted = () => {
    return process.env.S3_PERSISTENCE_BUCKET;
  };
  if (isAlexaHosted()) {
    const S3PersistenceAdapter = require("ask-sdk-s3-persistence-adapter");
    return new S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET
    });
  } else {
    const DynamoDBPersistenceAdapter = require("ask-sdk-dynamodb-persistence-adapter");
    return new DynamoDBPersistenceAdapter({
      tableName: tableName,
      createTable: true
    });
  }
};

// ------------------------------------------------------------------------------------

const Reddit = new snoowrap({
  userAgent: creds.user_agent,
  clientId: creds.client_id,
  clientSecret: creds.client_secret,
  refreshToken: creds.refresh_token
});

const getSubRedditDeals = async dealType => {
  const listOfPosts = await Reddit.getSubreddit(dealType).getTop();
  let deal = [];
  for (let i = 0; i < listOfPosts.length; i++) {
    deal.push(listOfPosts[i].title);
  }
  return deal;
};

// Promise.resolve(getSubRedditDeals()).then(console.log);
//----------------------------------------------------------------------------------------

/* INTERCEPTORS */

const LoadPersistentAttributesRequestInterceptor = {
  async process(handlerInput) {
    const { attributesManager, requestEnvelope } = handlerInput;
    if (Alexa.isNewSession(requestEnvelope)) {
      const persistentAttributes =
        (await attributesManager.getPersistentAttributes()) || {};
      console.log(
        "Loading from persistent storage: " +
          JSON.stringify(persistentAttributes)
      );
      attributesManager.setSessionAttributes(persistentAttributes);
    }
  }
};

const SavePersistentAttributesResponseInterceptor = {
  async process(handlerInput, response) {
    if (!response) return;
    const { attributesManager, requestEnvelope } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const shouldEndSession =
      typeof response.shouldEndSession === "undefined"
        ? true
        : response.shouldEndSession;
    if (
      shouldEndSession ||
      Alexa.getRequestType(requestEnvelope) === "SessionEndedRequest"
    ) {
      sessionAttributes["sessionCounter"] = sessionAttributes["sessionCounter"]
        ? sessionAttributes["sessionCounter"] + 1
        : 1;
      console.log(
        "Saving to persistent storage: " + JSON.stringify(sessionAttributes)
      );
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();
    }
  }
};

// ----------------------------------------------------------------------------------------
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const dealType = sessionAttributes["dealtype"];
    const sessionCounter = sessionAttributes["sessionCounter"];

    if (dealType !== null && dealType !== undefined) {
      return GetDealsIntentHandler.handle(handlerInput);
    }

    const speakOutput = constants.languageStrings.en.WELCOME_MSG;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDelegateDirective({
        name: "GetDealsIntent",
        confirmationStatus: "NONE",
        slots: {}
      })
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
    const intent = requestEnvelope.request;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    if (intent.confirmationStatus === "CONFIRMED") {
      const dealType = Alexa.getSlotValue(requestEnvelope, "dealtype");
      if (dealType.includes("sneaker")) {
        Promise.resolve(getSubRedditDeals("SneakerDeals")).then(
          s =>
            (sessionAttributes["speakStr"] = s.join(" and the next deal is "))
        );
      } else if (dealType.includes("frugal")) {
        Promise.resolve(getSubRedditDeals("frugalmalefashion")).then(
          s =>
            (sessionAttributes["speakStr"] = s.join(" and the next deal is "))
        );
      }
    }

    return (
      handlerInput.responseBuilder
        .speak("Here are the deals,\n" + sessionAttributes["speakStr"])
        .reprompt("Oops, something looks wrong, by the way, how you doin?")
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
    const speakOutput = constants.languageStrings.en.HELP_MSG;

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
    const speakOutput = constants.languageStrings.en.GOODBYE_MSG;
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
    const speakOutput = constants.languageStrings.en.ERROR_MSG;

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
  .addRequestInterceptors(LoadPersistentAttributesRequestInterceptor)
  .addResponseInterceptors(SavePersistentAttributesResponseInterceptor)
  .withPersistenceAdapter(getPersistenceAdapter)
  .lambda();
