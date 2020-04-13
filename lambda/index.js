// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require("ask-sdk-core");
const interceptors = require("./interceptors");
const util = require("./util");
const handlers = require("./handlers");

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    handlers.LaunchRequestHandler,
    handlers.GetDealsIntentHandler,
    handlers.HelpIntentHandler,
    handlers.CancelAndStopIntentHandler,
    handlers.SessionEndedRequestHandler,
    handlers.FallbackIntentHandler,
    handlers.IntentReflectorHandler // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(handlers.ErrorHandler)
  .addRequestInterceptors(
    interceptors.LoggingRequestInterceptor,
    interceptors.LoadAttributesRequestInterceptor,
    interceptors.LoadNameRequestInterceptor,
    interceptors.LocalisationRequestInterceptor
  )
  .addResponseInterceptors(
    interceptors.LoggingResponseInterceptor,
    interceptors.SaveAttributesResponseInterceptor
  )
  .withPersistenceAdapter(util.getPersistenceAdapter())
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
