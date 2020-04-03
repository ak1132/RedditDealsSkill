# Reddit Deals Skill
An Alexa skill to get a flash briefing of the latest reddit deals. The skills takes the top 10 posts from either [r/SneakerDeals](https://www.reddit.com/r/SneakerDeals/), [r/FrugalFemaleFashion](https://www.reddit.com/r/FrugalFemaleFashion/) and [r/frugalmalefashion](https://www.reddit.com/r/frugalmalefashion/) and gives a flash briefing of the latest deal.

Refer [here](https://developer.amazon.com/blogs/alexa/post/77c8f0b9-e9ee-48a9-813f-86cf7bf86747/setup-your-local-environment-for-debugging-an-alexa-skill) for information on how to debug errors on your local machine for Alexa Skills.

The skill is built using Node.js and ultilizes the [Snoowrap API](https://github.com/not-an-aardvark/snoowrap) for pulling information from Reddit.

Information to generate Reddit OAuth tokens, refer to [link](https://browntreelabs.com/scraping-reddits-api-with-snoowrap/)

# Currently accepted questions answered by the skill.

1. Get me deals for men/women/male/female.
2. Get me sneaker/frugalmalefashion/frugalfemalefashion/men fashion/female fashion deals.
3. What's the latest deal on sneakers?
4. Get me latest sneaker/male/female deals.

![Skill demo](https://github.com/ak1132/RedditDealsSkill/blob/master/working.png)


