import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'
import { CompiledContract, defaultProvider } from 'starknet';
import { useState } from 'react'
import './App.css'
import { randomAddress } from 'starknet/dist/utils/stark';

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
    .then(x => x.json())
    .then(setContract)
    .catch(setError)
  }


  const handleDeploy = async () => {
    if(!compiledContract) {
      return
    }

    defaultProvider.addTransaction({
      type: 'DEPLOY',
      contract_definition: compiledContract.contract_definition,
      contract_address_salt: randomAddress(),
      constructor_calldata: []
    })
      .then(() => setDeployStatus(true))
      .catch(setError)
  }

  const handleScript = () => {
    client.call('fileManager', 'writeFile', './scripts/deploy.js', `
// Right click on the script name and hit "Run" to execute
(async () => {
    try {
        console.log('Running deployWithEthers script...')
    
        starknet.defaultProvider.addTransaction({
          type: 'DEPLOY',
          contract_definition: ${JSON.stringify(compiledContract!.contract_definition)},
          contract_address_salt: '${randomAddress()}',
          constructor_calldata: []
        })
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

      {compiledContract ? <div role="button" onClick={handleScript}>Create deploy script</div> : null}

      {hasCreatedScript ? <p>Created script at ./scripts/deploy.js</p> : null}
    </div>  
  )
}

export default App
