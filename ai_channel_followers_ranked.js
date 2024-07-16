const csvParser = require('csv-parser');
const fs = require('fs');
const { init, fetchQueryWithPagination } = require('@airstack/node');
const { createObjectCsvWriter } = require('csv-writer');


// Initialize the Airstack SDK with your API key and environment
init("api key", "prod");

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
  ],
  append: true
});

// Asynchronously fetch data and handle pagination
async function fetchData() {
  try {
    let result = await fetchQueryWithPagination(query);

    // Initialize an empty array to hold all participants
    let allParticipants = [];

    // Loop through all pages of results
    while (result) {
       // Check if result.data.FarcasterChannelParticipants is not null
      if (result.data && result.data.FarcasterChannelParticipants && result.data.FarcasterChannelParticipants.FarcasterChannelParticipant) {
   
      // Extract the participants from the current page of results
      let participants = result.data.FarcasterChannelParticipants.FarcasterChannelParticipant;

      // Add the participants from the current page to allParticipants
      allParticipants.push(...participants);
      }
      // If there's another page, fetch it, otherwise break the loop
      if (result.hasNextPage) {
        console.log("Fetching next page...");
        result = await result.getNextPage();
      } else {
        break;
      }
    }
    // Filter out participants without socialCapital
    console.log("filtering nulls")
    allParticipants = allParticipants.filter(participant => participant.participant && participant.participant.socialCapital);    // Sort all participants by socialCapitalRank
    console.log("sorting")
    allParticipants.sort((a, b) => a.participant.socialCapital.socialCapitalRank - b.participant.socialCapital.socialCapitalRank);

    // keep a count for the CSV
    validCount = 1

    const records = allParticipants.map((participant, index) => {
      
    let blockchain = '';
    if (participant.participant.connectedAddresses && participant.participant.connectedAddresses.length > 0) {
      blockchain = participant.participant.connectedAddresses.map(ca => ca.blockchain).filter(Boolean).join(', ');
    }

    let address = '';
    if (participant.participant.connectedAddresses && participant.participant.connectedAddresses.length > 0) {
      address = participant.participant.connectedAddresses[0].address || '';
    }
    
      // increment the valid address count, 
      validCount++;


  return {
      count: validCount,
      profileName: participant.participant.profileName,
      fid: participant.participant.fid,
      socialCapitalScore: participant.participant.socialCapital.socialCapitalScore,
      socialCapitalRank: participant.participant.socialCapital.socialCapitalRank,
      custodyAddress: participant.participant.custodyAddress,
      address: address,
      blockchain: blockchain
    };
  }).filter(record => record !== null);  // Remove null records;
  

    await csvWriter.writeRecords(records);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// Run the fetch function
fetchData();