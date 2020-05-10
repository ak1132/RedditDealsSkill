const Alexa = require("ask-sdk-core");
const localisation = require("./localisation");
const Reddit = require("./logic");
const util = require("./util");
const constants = require("./constants");

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
    const sessionCounter = sessionAttributes["sessionCounter"] || "";
    const name = sessionAttributes["name"] || "";

    if (
      typeof dealType !== "undefined" &&
      dealType !== null &&
      dealType !== ""
    ) {
      return GetDealsIntentHandler.handle(handlerInput);
    }
    let speechText = sessionCounter === ""
      ? handlerInput.t("WELCOME_MSG", { name: name })
      : handlerInput.t("WELCOME_BACK_MSG", { name: name });
    return handlerInput.responseBuilder
      .speak(speechText)
      .addDelegateDirective({
        name: "GetDealsIntent",
        confirmationStatus: "NONE",
        slots: {},
      })
      .getResponse();
  },
};

const GetDealsIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "GetDealsIntent"
    );
  },
  async handle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const dealType = Alexa.getSlotValue(requestEnvelope, "dealtype");
    const { attributesManager } = handlerInput;
    const sessionAttributes = await attributesManager.getSessionAttributes();
    const name = sessionAttributes["name"] || "";
    let dT = "";

    if (dealType.includes("sneaker")) {
      dT = await Reddit.getSubRedditDeals(constants.SNEAKER_DEALS);
    } else if (
      dealType.includes("male") ||
      dealType.includes("men") ||
      dealType.includes("man")
    ) {
      dT = await Reddit.getSubRedditDeals(constants.FRUGAL_MALE_FASHION);
    } else if (
      dealType.includes("female") ||
      dealType.includes("women") ||
      dealType.includes("woman")
    ) {
      dT = await Reddit.getSubRedditDeals(constants.FRUGAL_FEMALE_FASHION);
    } else if (dealType.includes("steam")) {
      dT = await Reddit.getSubRedditDeals(constants.STEAM_DEALS);
    } else if (dealType.includes("tech")) {
      dT = await Reddit.getSubRedditDeals(constants.TECH_DEALS);
    } else if (dealType.includes("game")) {
      dT = await Reddit.getSubRedditDeals(constants.GAME_DEALS);
    }

    let speechText = "";

    if (typeof dT !== "undefined") {
      let output = dT.map(function (x) {
        return x.replace(/[-&\/\\#,+()~'":*?<>{}|]/g, "");
      });
      let len = output.length;
      for (let i = 0; i < len; i++) {
        let temp = output[i];
        if (speechText.length + temp.length <= 600) {
          speechText += temp + ". The next deal is ,";
        }
      }
      let last = speechText.lastIndexOf(". The next deal is ,");
      speechText = speechText.substring(0, last);
    }

    speechText = handlerInput
      .t("RESPONSE_MSG", { name: name })
      .concat(speechText);

    console.log(speechText);

    try {
      // call the progressive response service
      await util.callDirectiveService(handlerInput, speechText);
    } catch (error) {
      // if it fails we can continue, but the user will wait without progressive response
      console.log("Progressive response directive error : " + error);
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(handlerInput.t("REPROMPT_MSG"))
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(handlerInput.t("GOODBYE_MSG", { name: name }))
      .reprompt(handlerInput.t("REPROMPT_MSG"))
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = handlerInput.t("HELP_MSG");

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  },
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
  async handle(handlerInput) {
    const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
    const name = sessionAttributes["name"] || "";
    const speakOutput = handlerInput.t("GOODBYE_MSG", { name: name });
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) ===
      "SessionEndedRequest"
    );
  },
  async handle(handlerInput) {
    const sessionAttributes = await handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes["sessionCounter"] = "";
    return handlerInput.responseBuilder.getResponse();
  },
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
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);
    const speakOutput = localisation.languageStrings.en.ERROR_MSG;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(handlerInput.t("REPROMPT_MSG"))
      .getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) ===
        "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    const speechText = handlerInput.t("FALLBACK_MSG");

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(handlerInput.t("REPROMPT_MSG"))
      .getResponse();
  },
};

module.exports = {
  LaunchRequestHandler,
  GetDealsIntentHandler,
  HelpIntentHandler,
  CancelAndStopIntentHandler,
  SessionEndedRequestHandler,
  FallbackIntentHandler,
  IntentReflectorHandler,
};
