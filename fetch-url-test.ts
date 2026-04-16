import { FetchClient, Config } from 'coze-coding-dev-sdk';

async function main() {
  const config = new Config();
  const client = new FetchClient(config);

  const url = 'https://p.kdocs.cn/s/HSXHFUJGACAEI';
  
  console.log(`Fetching: ${url}`);
  
  const response = await client.fetch(url);
  
  console.log(`Status: ${response.status_code === 0 ? 'Success' : 'Failed'}`);
  console.log(`Title: ${response.title}`);
  console.log(`Content type: ${response.filetype}`);
  console.log('\n--- Content ---\n');
  
  for (const item of response.content) {
    if (item.type === 'text' && item.text) {
      console.log(item.text);
    }
  }
}

main().catch(console.error);
