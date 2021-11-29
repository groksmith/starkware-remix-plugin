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
  const [deployIsLoading, setLoading] = useState(false)
  const [deployedContract, setDeployedContract] = useState<string | undefined>(undefined)
  const [hasCreatedScript, setScriptStatus] = useState(false)
  const [noFileSelected, setFileSelection] = useState(false)

  const handleCompile = async () => {
    setLoading(false)
    setContract(null)
    setScriptStatus(false)
    setFileSelection(false)
    setDeployedContract(undefined)

    let currentFile;

    try {
      currentFile = await client.call('fileManager', 'getCurrentFile')
      
    } catch (error) {
      setFileSelection(true)
      return 
    }

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
    setLoading(true)
    defaultProvider.addTransaction({
      type: 'DEPLOY',
      contract_definition: compiledContract.contract_definition,
      contract_address_salt: randomAddress(),
      constructor_calldata: []
    })
      .then((res) => {
        setLoading(false)
        setDeployedContract(res.address)
      })
      .catch(setError)
  }

  const handleScript = async () => {
    let dir = null;

    try {
      dir = await client.call('fileManager', 'readdir', './compiled_cairo_artifacts');
    } catch (error) {
      console.log(error)
    }

    if(!dir) {
      dir = await client.call('fileManager', 'mkdir', 'compiled_cairo_artifacts');
      console.log(dir)
    }

    await client.call('fileManager', 'writeFile', 'compiled_cairo_artifacts/contract.json', JSON.stringify(compiledContract));

    client.call('fileManager', 'writeFile', './scripts/deploy.js', `
// Right click on the script name and hit "Run" to execute
(async () => {
    try {
        console.log('deploy to starknet...')
        const compiledCairoContract = await remix.call('fileManager', 'readFile', 'compiled_cairo_artifacts/contract.json');
        const compiledContract = starknet.json.parse(compiledCairoContract);
        const res = await starknet.defaultProvider.addTransaction({
          type: 'DEPLOY',
          contract_definition: compiledContract.contract_definition,
          contract_address_salt: '${randomAddress()}',
          constructor_calldata: []
        })
        console.log('Deployed contract address: ', res.address)
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

      {deployIsLoading ? <p>Deploying...</p> : null}

      {deployedContract && !deployIsLoading ? 
        <>
          <p>Deployed contract address</p>
          <p className="contractAddress">{deployedContract}</p>
        </>
      : null}

      {compiledContract ? <div role="button" onClick={handleScript}>Create deploy script</div> : null}

      {hasCreatedScript ? <p>Created script at ./scripts/deploy.js</p> : null}

      {noFileSelected ? <p>Please select file containing Cairo contract</p> : null}
    </div>  
  )
}

export default App
