const Alexa = require("ask-sdk-core");
const languageStrings = require("./localisation");
const i18n = require("i18next");
const constants = require("./constants");

const LoadAttributesRequestInterceptor = {
  async process(handlerInput) {
    const { attributesManager, requestEnvelope } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    if (Alexa.isNewSession(requestEnvelope) || !sessionAttributes["loaded"]) {
      const persistentAttributes =
        (await attributesManager.getPersistentAttributes()) || {};
      console.log(
        "Loading from persistent storage: " +
          JSON.stringify(persistentAttributes)
      );
      persistentAttributes["loaded"] = true;
      attributesManager.setSessionAttributes(persistentAttributes);
    }
  },
};

const SaveAttributesResponseInterceptor = {
  async process(handlerInput, response) {
    if (!response) return;
    const { attributesManager, requestEnvelope } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const shouldEndSession =
      typeof response.shouldEndSession === "undefined"
        ? true
        : response.shouldEndSession;
    const loadedSession = sessionAttributes["loaded"];
    if (
      (shouldEndSession ||
        Alexa.getRequestType(requestEnvelope) === "SessionEndedRequest") &&
      loadedSession
    ) {
      sessionAttributes["sessionCounter"] = sessionAttributes["sessionCounter"]
        ? sessionAttributes["sessionCounter"] + 1
        : 1;
      for (var key in sessionAttributes) {
        if (!constants.PERSISTENT_ATTRIBUTES_NAMES.includes(key)) {
          delete sessionAttributes[key];
        }
      }
      console.log(
        "Saving to persistent storage: " + JSON.stringify(sessionAttributes)
      );
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();
    }
  },
};

const LoggingRequestInterceptor = {
  process(handlerInput) {
    console.log(
      `Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  },
};

const LoggingResponseInterceptor = {
  process(handlerInput, response) {
    console.log(`Outgoing response: ${JSON.stringify(response)}`);
  },
};

const LoadNameRequestInterceptor = {
  async process(handlerInput) {
    const {
      attributesManager,
      serviceClientFactory,
      requestEnvelope,
    } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    if (!sessionAttributes["name"]) {
      // let's try to get the given name via the Customer Profile API
      // don't forget to enable this permission in your skill configuratiuon (Build tab -> Permissions)
      // or you'll get a SessionEndedRequest with an ERROR of type INVALID_RESPONSE
      // Per our policies you can't make personal data persistent so we limit "name" to session attributes
      try {
        const { permissions } = requestEnvelope.context.System.user;
        if (!(permissions && permissions.consentToken))
          throw { statusCode: 401, message: "No permissions available" }; // there are zero permissions, no point in intializing the API
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        const profileName = await upsServiceClient.getProfileGivenName();
        if (profileName) {
          // the user might not have set the name
          //save to session attributes
          sessionAttributes["name"] = profileName;
        }
      } catch (error) {
        console.log(JSON.stringify(error));
        if (error.statusCode === 401 || error.statusCode === 403) {
          // the user needs to enable the permissions for given name, let's append a permissions card to the response.
          handlerInput.responseBuilder.withAskForPermissionsConsentCard(
            constants.GIVEN_NAME_PERMISSION
          );
        }
      }
    }
  },
};

const LocalisationRequestInterceptor = {
  process(handlerInput) {
    const localisationClient = i18n.init({
      lng: Alexa.getLocale(handlerInput.requestEnvelope),
      resources: languageStrings,
      returnObjects: true,
    });
    localisationClient.localise = function localise() {
      const args = arguments;
      const value = i18n.t(...args);
      if (Array.isArray(value)) {
        return value[Math.floor(Math.random() * value.length)];
      }
      return value;
    };
    handlerInput.t = function translate(...args) {
      return localisationClient.localise(...args);
    };
  },
};

module.exports = {
  LoggingRequestInterceptor,
  LoggingResponseInterceptor,
  SaveAttributesResponseInterceptor,
  LoadAttributesRequestInterceptor,
  LoadNameRequestInterceptor,
  LocalisationRequestInterceptor,
};
