import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'
import { CompiledContract, defaultProvider } from 'starknet';
import Crypto from 'crypto-js'
import { useState } from 'react'
import './App.css'

const client = createClient(new PluginClient())

type ContractType = {
  contract_definition: CompiledContract,
  version: number
}

function App() {
  const [compiledContract, setContract] = useState<ContractType | null>(null)
  const [error, setError] = useState<any>(false)
  const [hasDeployed, setDeployStatus] = useState(false)
  const [hasCreatedScript, setScriptStatus] = useState(false)

  const handleCompile = async () => {
    setDeployStatus(false)
    setContract(null)
    setScriptStatus(false)

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
    
    defaultProvider.deployContract(compiledContract.contract_definition)
      .then(() => setDeployStatus(true))
      .catch(setError)

    // fetch('https://alpha3.starknet.io/gateway/add_transaction', {
    //   method: 'POST',
    //   headers: {
    //     accept: 'application/json',
    //   },
    //   body: JSON.stringify({
    //     type: "DEPLOY",
    //     contract_address_salt: `0x0${Crypto.lib.WordArray.random(128 / 8).toString()}`,
    //     contract_definition: compiledContract.contract_definition,
    //     constructor_calldata : []
    //   })
    // })
    //   .then(() => setDeployStatus(true))
    //   .catch(setError)
  }

  const handleScript = () => {
    client.call('fileManager', 'writeFile', './scripts/deploy.js', `
// Right click on the script name and hit "Run" to execute
(async () => {
    try {
        console.log('Running deployWithEthers script...')
    
        starknet.deployContract(${JSON.stringify(compiledContract?.contract_definition)})
        console.log('Deployment successful.')
    } catch (e) {
        console.log(e.message)
    }
})()
    `).then(() => setScriptStatus(true))
  }

  if(error) {
    return (
      <div className="container">
        <h4>Error while compiling</h4>
        <div role="button" onClick={() => window.location.reload()}>Reload plugin</div>
      </div>
     )
  }

  return (
    <div className="container">
      <div role="button" onClick={handleCompile}>Compile current file</div>
      {compiledContract ? (
        <>
          <h3>Compiled</h3>
          <div role="button" onClick={handleDeploy}>Deploy</div>
        </>
      ) : null}

      {hasDeployed ?  <h3>Deployed!</h3> : null}

      <div role="button" onClick={handleScript}>Create deploy script</div>

      {hasCreatedScript ? <p>Created script at ./scripts/deploy.js</p> : null}
    </div>  
  )
}

export default App
