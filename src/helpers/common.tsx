import { CompiledContract } from 'starknet';
import { randomAddress } from 'starknet/dist/utils/stark';

export type ContractType = {
    contract_definition: CompiledContract,
    version: number
}

export type ProviderOptions = {
  network: NetworkName;
} | {
  baseUrl: string;
};

export type NetworkName = 'mainnet-alpha' | 'goerli-alpha' | 'devnet';


export const DeployScriptContent = `
// Right click on the script name and hit "Run" to execute
(async () => {
    try {
        console.log('deploy to starknet...')
        const compiledCairoContract = await remix.call('fileManager', 'readFile', 'compiled_cairo_artifacts/contract.json');
        const compiledContract = starknet.json.parse(compiledCairoContract);
        
        const provider = new starknet.Provider({
          network: 'goerli-alpha' // mainnet-alpha or goerli-alpha
        })

        const res = await provider.addTransaction({
          type: 'DEPLOY',
          contract_definition: compiledContract.contract_definition,
          contract_address_salt: '${randomAddress()}',
          constructor_calldata: []
        })

        //  const methodResponse = await callContract({
        //    contract_address: res.address,
        //    entry_point_selector: getSelectorFromName("YOUR_FUNCTION_NAME"),
        //    calldata: ["1"],
        //  });

        // const result = methodResponse.result[0];
        // result contains the return value of the method you gave to callContract

        console.log('Deployed contract address: ', res.address)
        console.log('Deployed contract transaction hash: ', res.transaction_hash)
        console.log('Deployment successful.')
    } catch (e) {
        console.log(e.message)
    }
})()
`