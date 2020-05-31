const snoowrap = require("snoowrap");
const creds = require("./oauth_info.json");

const Reddit = new snoowrap({
  userAgent: creds.user_agent,
  clientId: creds.client_id,
  clientSecret: creds.client_secret,
  refreshToken: creds.refresh_token,
});

const getSubRedditDeals = async (dealType) => {
  const listOfPosts = await Reddit.getSubreddit(dealType).getTop();
  let deal = [];
  for (let i = 0; i < listOfPosts.length; i++) {
    deal.push(listOfPosts[i].title);
  }
  return deal;
};

module.exports = {
  getSubRedditDeals,
};
