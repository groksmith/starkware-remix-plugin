import { randomAddress } from 'starknet/dist/utils/stark';

export const NetworkBaseUrls: any = {
  'goerli-alpha': 'https://alpha4.starknet.io',
  'mainnet-alpha': 'https://alpha-mainnet.starknet.io'
}

export const addTransaction = async (payload: any) => {
  const baseUrl = payload['network'] ? NetworkBaseUrls[payload['network']] : payload['baseUrl'];

  return fetch(`${baseUrl}/gateway/add_transaction`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
      body: JSON.stringify({
        type: 'DEPLOY',
        contract_address_salt: randomAddress(),
        contract_definition: payload.compiledContract.contract_definition,
        constructor_calldata: payload.transactionInputs
      })
    })
}