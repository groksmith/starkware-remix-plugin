import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'
import { useState } from 'react'
import Crypto from 'crypto-js'
import './App.css'

const client = createClient(new PluginClient())

function App() {
  const [compiledContract, setContract] = useState<Record<string, any> | null>(null)
  const [error, setError] = useState<any>(null)

  // useEffect(() => {
  //   console.log(client)
  //   client.onload(async () => {
  //     const data = await client.call('fileManager', 'readFile', 'ballot.sol')
  //     console.log('data', data)
  //   })
  // })


  const handleCompile = async () => {
    const currentFile = await client.call('fileManager', 'getCurrentFile')
    const data = await client.call('fileManager', 'readFile', currentFile)
    

    fetch('https://2uuf49xjkk.execute-api.us-east-2.amazonaws.com/prod/cairo', {
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
      body: JSON.stringify({
        action: "compile-contract",
        code: data
      })
    })
    .then(res => res.json())
    .then(setContract)
    .catch(setError)
  }


  const handleDeploy = async () => {
    if(!compiledContract) {
      return
    }

    fetch('https://alpha3.starknet.io/gateway/add_transaction', {
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
      body: JSON.stringify({
        type: "DEPLOY",
        contract_address_salt: `0x0${Crypto.lib.WordArray.random(128 / 8).toString()}`,
        contract_definition: {
                abi: [],
                entry_points_by_type: {
                    EXTERNAL: [],
                    L1_HANDLER: [],
                    CONSTRUCTOR: []
                },
                program: compiledContract.contract_definition.program
            },
        constructor_calldata : []
      })
    })
  }

  if(error) {
    return <h3>Error while compiling</h3>
  }

  return (
    <div className="container">
      <div role="button" onClick={handleCompile}>Compile current file</div>
      {compiledContract ? (
        <>
          <h3>Compiled</h3>
          <div className="codeSection">{compiledContract.contract_definition.program}</div>
          <div role="button" onClick={handleDeploy}>Deploy</div>
        </>
      ) : null}
    </div>  
  )
}

export default App
