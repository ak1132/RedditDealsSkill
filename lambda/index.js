// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require("ask-sdk-core");
const snoowrap = require("snoowrap");
const creds = require("../oauth_info.json");
const constants = require("./constants");
const adapter = require("ask-sdk-s3-persistence-adapter");

// --------------------PERSISTENCE ADAPTER----------------------------------------------------------------
const s3PersistenceAdapter = new adapter.S3PersistenceAdapter({
  bucketName: process.env.S3_PERSISTENCE_BUCKET
});

// const DynamoDBPersistenceAdapter = require("ask-sdk-dynamodb-persistence-adapter");
// const dynamoDBAdapter = new DynamoDBPersistenceAdapter({
//       tableName: tableName,
//       createTable: true
// });

// ---------------------REDDIT API----------------------------------------------------------

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

/*-------------------- INTERCEPTORS ------------------------------------------------------------------------*/

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

// -----------------------ALEXA EVENT HANDLERS-----------------------------------------------------------------

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest"
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = await attributesManager.getSessionAttributes();
    const dealType = sessionAttributes["dealtype"];

    if (
      typeof dealType !== "undefined" &&
      dealType !== null &&
      dealType !== ""
    ) {
      return GetDealsIntentHandler.handle(handlerInput);
    }

    const speakOutput = constants.languageStrings.en.WELCOME_MSG;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDelegateDirective({
        name: "GetDeals",
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
      handlerInput.requestEnvelope.request.intent.name === "GetDeals"
    );
  },
  async handle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const intent = requestEnvelope.request;

    const dealType = Alexa.getSlotValue(requestEnvelope, "dealtype");
    let dT = "";
    if (dealType.includes("sneaker")) {
      dT = await getSubRedditDeals("SneakerDeals");
    } else if (dealType.includes("frugal")) {
      dT = await getSubRedditDeals("frugalmalefashion");
    }
    let speechText = "";
    if (typeof dT !== "undefined") {
      speechText = dT.map(function(x) {
        return x.replace(/[-&\/\\#,+()~'":*?<>{}|]/g, "");
      });
      speechText = speechText.join(". The next deal is ,");
    }
    speechText = "Here are the deals, ".concat(speechText);
    console.log(speechText);
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt("Oops, something looks wrong, by the way, how you doin?")
      .getResponse();
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

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest"
    );
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};

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
  .withPersistenceAdapter(s3PersistenceAdapter)
  .lambda();
