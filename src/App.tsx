import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'
import { Provider, } from 'starknet';
import { useState } from 'react'
import { randomAddress } from 'starknet/dist/utils/stark';
import { NetworkName, ContractType, DeployScriptContent } from './helpers/common';
import Error from './components/CompilationError/CompilationError';
import './App.css'

const remixClient = createClient(new PluginClient())
const cairoHostUrl : string = process.env.REACT_APP_CAIRO_HOST_URL || '';
const deployScriptDirectory = './scripts/deploy.js';
const contractDirectory = 'compiled_cairo_artifacts/contract.json';
const allowedFileExtensions = ['cairo'];

function App() {
  const [compiledContract, setContract] = useState<ContractType | null>(null);
  const [compilationError, setCompilationError] = useState<any>(null);
  const [error, setError] = useState<any>(false);
  const [deployIsLoading, setLoading] = useState(false);
  const [deployedContract, setDeployedContract] = useState<string | undefined>(undefined);
  const [hasCreatedScript, setScriptStatus] = useState(false);
  const [noFileSelected, setNoFileSelected] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>('mainnet-alpha');
  const [compiling, setCompilingStatus] = useState(false);

  const compileContract = async () => {
    setLoading(false);
    setContract(null);
    setScriptStatus(false);
    setNoFileSelected(false);
    setDeployedContract(undefined);
    setCompilationError(null)

    let currentFile: string;

    try {
      currentFile = await remixClient.call('fileManager', 'getCurrentFile');
    } catch (error) {
      setNoFileSelected(true);
      return;
    }

    const currentFileExtension = currentFile.split('.').pop() || '';

    if (!allowedFileExtensions.includes(currentFileExtension)) {
      setNoFileSelected(true);
      return;
    }

    const currentFileContent = await remixClient.call('fileManager', 'readFile', currentFile);

    setCompilingStatus(true);
    runContractCompilation(currentFileContent);
  }

  const runContractCompilation = async (currentFileContent: string) => {
    try {
      const response = await fetch(cairoHostUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
        },
        body: JSON.stringify({
          action: "compile-contract",
          code: currentFileContent
        })
      });
      const responseData = await response.json();
      setCompilingStatus(false);
      if (responseData.error) {
        setCompilationError(responseData.error);
        return;
      }

      setContract(responseData);
    } catch(exception) {
      console.error(exception);
    }
  }

  const deployContract = () => {
    if(!compiledContract) {
      return;
    }

    setLoading(true);

    const provider = new Provider({
      network: selectedNetwork,
    })

    provider.addTransaction({
      type: 'DEPLOY',
      contract_definition: compiledContract.contract_definition,
      contract_address_salt: randomAddress(),
      constructor_calldata: []
    })
    .then((res) => {
      setLoading(false);
      setDeployedContract(res.address);
    })
    .catch(setError);
  }

  const deployScript = async () => {
    await remixClient.call('fileManager', 'writeFile', contractDirectory, JSON.stringify(compiledContract));

    remixClient.call('fileManager', 'writeFile', deployScriptDirectory, DeployScriptContent).then(() => setScriptStatus(true));
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
      <div role="button" onClick={compileContract}>{
        compiling ? 'Compiling...' : 'Compile current file'
      }</div>
      {compiledContract ? (
        <>
          <div className='networkSelect'>
            <label>STARKNET NETWORK</label>
            <select value={selectedNetwork} onChange={(event) => setSelectedNetwork(event.target.value as NetworkName)}>
              <option value="mainnet-alpha">mainnet-alpha</option>
              <option value="goerli-alpha">goerli-alpha</option>
            </select>
          </div>
          <div role="button" onClick={deployContract}>Deploy</div>
        </>
      ) : null}

      {deployIsLoading ? <p>Deploying...</p> : null}

      {deployedContract && !deployIsLoading ? 
        <>
          <p>Deployed contract address</p>
          <p className="contractAddress">{deployedContract}</p>
        </>
      : null}

      {compiledContract ? <div role="button" onClick={deployScript}>Create deploy script</div> : null}

      {hasCreatedScript ? <p>Created script at {deployScriptDirectory}</p> : null}

      {noFileSelected ? <p>Please select file containing Cairo contract</p> : null}

      {compilationError ?  <Error message={compilationError} /> : null}

    </div>  
  )
}

export default App
