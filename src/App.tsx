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
const deployScriptDirectory = './scripts';
const defaultScriptFileName = 'deploy.js';
const contractDirectory = 'compiled_cairo_artifacts/contract.json';
const allowedFileExtensions = ['cairo'];

function App() {
  const [compiledContract, setContract] = useState<ContractType | null>(null);
  const [compilationErrorTrace, setCompilationErrorTrace] = useState<any>(null);
  const [deploymentError, setDeploymentError] = useState<any>(false);
  const [deployIsLoading, setLoading] = useState(false);
  const [deployedContract, setDeployedContract] = useState<string | undefined>(undefined);
  const [hasCreatedScript, setScriptStatus] = useState(false);
  const [noFileSelected, setNoFileSelected] = useState(false);
  const [scriptFileName, setScriptFileName] = useState(defaultScriptFileName);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>('goerli-alpha');
  const [compiling, setCompilingStatus] = useState(false);

  const compileContract = async () => {
    setLoading(false);
    setContract(null);
    setScriptStatus(false);
    setNoFileSelected(false);
    setDeployedContract(undefined);
    setCompilationErrorTrace(null)

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
    await remixClient.editor.clearAnnotations();
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

  const setCompilationError = async (error: any) => {
    setCompilationErrorTrace(error);
    const errorObject = error.split(':');
    const row = +errorObject[2];
    const column = +errorObject[3];

    if (isNaN(row) || isNaN(column)) return;
    await remixClient.editor.addAnnotation({ row: row-1, column: column, text: error, type: 'error' });
  }

  const deployContract = async () => {
    if(!compiledContract) {
      return;
    }

    setDeployedContract(undefined);
    setDeploymentError(null);
    setLoading(true);

    const provider = new Provider({
      network: selectedNetwork,
    })

    try {
      const response = await provider.addTransaction({
        type: 'DEPLOY',
        contract_definition: compiledContract.contract_definition,
        contract_address_salt: randomAddress(),
        constructor_calldata: []
      });
      
      setDeployedContract(response.address);
    } catch (exception: any) {
      setDeploymentError(exception.response.data.message);
    }

    setLoading(false);
  }

  const deployScript = async () => {
    await remixClient.call('fileManager', 'writeFile', contractDirectory, JSON.stringify(compiledContract));
    if (!scriptFileName) setScriptFileName(defaultScriptFileName);
    remixClient.call('fileManager', 'writeFile', `${deployScriptDirectory}/${scriptFileName || defaultScriptFileName}`, DeployScriptContent).then(() => setScriptStatus(true));
  }

  const changeScriptFileName = (value: string) => {
    setScriptFileName(value);
    setScriptStatus(false);
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
          <div className='deployScriptName'>
            <label>SCRIPT FILE NAME</label>
              <input value={scriptFileName} placeholder={defaultScriptFileName} onChange={(event) => changeScriptFileName(event.target.value)} type="text"/>
          </div>
          {(deploymentError) ?  <Error message={deploymentError} /> : null}
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

      {hasCreatedScript ? <p>Created script at {`${deployScriptDirectory}/${scriptFileName}`}</p> : null}

      {noFileSelected ? <p>Please select file containing Cairo contract</p> : null}

      {(compilationErrorTrace) ?  <Error message={compilationErrorTrace} /> : null}
    </div>  
  )
}

export default App
