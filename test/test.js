const snoowrap = require("snoowrap");
const creds = require("../oauth_info.json");

// const creds = {
//     "client_id": "7kamBn3K5RlZqg",
//     "client_secret":"Z3K07R_o1IvpsPLdhRDGkt-K6tU",
//     "user_agent": "A bot for finding the latest sneaker deals",
//     "refresh_token" : "41811051-sstmw1mb4nWOmarX_YnlZx6VltQ",
//     "access_token" : "41811051-11SatmLC2waVMqDVklRSje59R5o"
// }
  
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


const callDeal =  async() => {
    let dT = await getSubRedditDeals("SneakerDeals");
    let speechText = dT.map(function(x){return x.replace(/[-&\/\\#,+()~'":*?<>{}|]/g, '');});
    speechText = speechText.join(". The next deal is ,");
    console.log(speechText);
};

callDeal();