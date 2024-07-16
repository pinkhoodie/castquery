Three code parts: 
1. neynar_cast_query.sql: An SQL query through Neynar to get cast & fid data for any casts related to the keyword. This exact or modified query can be run here: https://data.hubs.neynar.com/queries/789/source and the results downloaded as CSV, with the first CSV seen in `keyword_ai_casts.csv`

2. parallized_batch_anthropic.js:
This script processes messages using the Anthropic API in parallel. It reads messages from a CSV file, sends them to the Anthropic API for scoring, and writes the results to a JSON file.

3. ai_channel_followers_ranked.js:
This Node.js script uses the Airstack SDK to fetch and process data about followers of the 'ai' channel on Farcaster. It includes pagination handling and writes the results to a CSV file 'aichannelfollowers.csv'.

Steps: 
1. Download the CSV files for all keywords
2. Combine the CSVs into a single file
3. Supply that file to the parallized_batch_anthropic.js script

Note: 
- The cast keyword query is currently set up to search for a single term ('% AI %') due to timeout constraints. A separate run for each keyword is needed. 
- Data contains the total count of reactions, and the count of unique casts by a user containing the keyword.

