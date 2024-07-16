const { init, fetchQueryWithPagination } = require('@airstack/node');
const { createObjectCsvWriter } = require('csv-writer');


// Load environment variables
dotenv.config();

const API_KEY = process.env.AIRSTACK_API_KEY;
if (!API_KEY) {
  throw new Error('AIRSTACK_API_KEY is not set in the environment variables');
}

// Initialize the Airstack SDK with your API key from environment variable
init(process.env.AIRSTACK_API_KEY, "prod");

// Define your GraphQL query
const query = `
query ChannelFollowersRanked {
    FarcasterChannelParticipants(
      input: {filter: {channelId: {_eq: "ai"}, channelActions: {_eq: follow}}, blockchain: ALL}
    ) {
      FarcasterChannelParticipant {
        participant {
          profileName
          fid: userId
          custodyAddress: userAddress
          connectedAddresses {
            address
            blockchain
          }
          socialCapital {
            socialCapitalScore
            socialCapitalRank
          }
        }
      }
    }
  }
`;

// CSV Writer setup
const csvWriter = createObjectCsvWriter({
  path: 'aichannelfollowers.csv',
  header: [
    { id: 'count', title: 'COUNT' },
    { id: 'profileName', title: 'PROFILE NAME' },
    { id: 'fid', title: 'USER ID' },
    { id: 'custodyAddress', title: 'CUSTODY ADDRESS' },
    { id: 'address', title: 'CONNECTED ADDRESS' },
    { id: 'blockchain', title: 'BLOCKCHAIN' },
    { id: 'socialCapitalRank', title: 'SOCIAL CAPITAL RANK' },
    { id: 'socialCapitalScore', title: 'SOCIAL CAPITAL SCORE' }
  ]
});

// Asynchronously fetch data and handle pagination
async function fetchData() {
  try {
    let allParticipants = [];
    let result = await fetchQueryWithPagination(query);

    while (result) {
      if (result.data?.FarcasterChannelParticipants?.FarcasterChannelParticipant) {
        allParticipants.push(...result.data.FarcasterChannelParticipants.FarcasterChannelParticipant);
      }
      
      if (result.hasNextPage) {
        console.log("Fetching next page...");
        result = await result.getNextPage();
      } else {
        break;
      }
    }

    console.log("Filtering and sorting participants...");
    allParticipants = allParticipants
      .filter(participant => participant.participant?.socialCapital)
      .sort((a, b) => a.participant.socialCapital.socialCapitalRank - b.participant.socialCapital.socialCapitalRank);

    const records = allParticipants.map((participant, index) => {
      const { participant: p } = participant;
      const connectedAddresses = p.connectedAddresses || [];
      
      return {
        count: index + 1,
        profileName: p.profileName,
        fid: p.fid,
        socialCapitalScore: p.socialCapital.socialCapitalScore,
        socialCapitalRank: p.socialCapital.socialCapitalRank,
        custodyAddress: p.custodyAddress,
        address: connectedAddresses[0]?.address || '',
        blockchain: connectedAddresses.map(ca => ca.blockchain).filter(Boolean).join(', ')
      };
    });

    console.log(`Writing ${records.length} records to CSV...`);
    await csvWriter.writeRecords(records);
    console.log("CSV writing complete.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

fetchData();