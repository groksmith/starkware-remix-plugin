import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'
import { Provider, CompiledContract} from 'starknet';
import { useState, useEffect } from 'react'
import { randomAddress } from 'starknet/dist/utils/stark';
import { NetworkName, ContractType, DeployScriptContent, ProviderOptions } from './helpers/common';
import Error from './components/CompilationError/CompilationError';
import ConstructorInputsForm from './components/ConstructorInputsForm/ConstructorInputsForm';

import './App.css'

const remixClient = createClient(new PluginClient())
const cairoHostUrl : string = process.env.REACT_APP_CAIRO_HOST_URL || '';
const deployScriptDirectory = './scripts';
const defaultScriptFileName = 'deploy.js';
const contractDirectory = 'compiled_cairo_artifacts/contract.json';
const allowedFileExtensions = ['cairo'];
const voyagerBasePaths = {
  'goerli-alpha': 'https://goerli.voyager.online/contract',
  'mainnet-alpha': 'https://voyager.online/contract',
  'devnet': ''
};


function App() {
  const [compiledContract, setContract] = useState<ContractType | null>(null);
  const [constructorInputs, setConstructorInputs] = useState(null);
  const [constructorInputValues, setConstructorInputValues] = useState([]);
  const [compilationErrorTrace, setCompilationErrorTrace] = useState<any>(null);
  const [deploymentError, setDeploymentError] = useState<any>(false);
  const [deployIsLoading, setLoading] = useState(false);
  const [deployedContract, setDeployedContract] = useState<any>(undefined);
  const [hasCreatedScript, setScriptStatus] = useState(false);
  const [noFileSelected, setNoFileSelected] = useState(false);
  const [scriptFileName, setScriptFileName] = useState(defaultScriptFileName);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>('goerli-alpha');
  const [devnetBaseUrl, setDevnetBaseUrl] = useState<string>('');
  const [devnetBaseUrlError, setDevnetBaseUrlError] = useState<boolean>(false);
  const [compiling, setCompilingStatus] = useState(false);
  const [currentFileName, setCurrentFileName] = useState('');

  useEffect(() => {
    setTimeout(() => {
      remixClient.on('fileManager', 'currentFileChanged', (currentFileChanged: any) => {
        const fileName = currentFileChanged.split('/').pop();
        const currentFileExtension = fileName.split('.').pop() || '';
        setNoFileSelected(!allowedFileExtensions.includes(currentFileExtension));
        setCurrentFileName(fileName);
      })
    }, 1000);
  }, [])

  const compileContract = async () => {
    if (noFileSelected|| !currentFileName) return;

    setLoading(false);
    setContract(null);
    setConstructorInputs(null);
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

      defineConstructorInputs(responseData);
      setContract(responseData);
    } catch(exception) {
      console.error(exception);
    }
  }

  const defineConstructorInputs = (contractData: ContractType) => {
    const constructorResponse: any = contractData.contract_definition.abi.find(item=>item.name === "constructor");
    if (!constructorResponse || !constructorResponse?.inputs?.length) return;
    setConstructorInputs(constructorResponse.inputs);
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
    if(!compiledContract || (isDevnet() && !devnetBaseUrl)) return;
    if (isDevnet() && !devnetBaseUrl.startsWith('https://')) return setDevnetBaseUrlError(true);

    setDeployedContract(undefined);
    setDeploymentError(null);
    setLoading(true);

    const payload: ProviderOptions | any = {};

    if(isDevnet()) {
      payload['baseUrl'] = devnetBaseUrl;
    } else {
      payload['network'] = selectedNetwork
    }

    const provider = new Provider(payload);
    try {
      const transactionInputs = (constructorInputs || []).map((item: any)=> constructorInputValues[item.name] || null);
      const response = await provider.deployContract({
        contract: compiledContract.contract_definition,
        addressSalt: randomAddress(),
        constructorCalldata: transactionInputs
      });

      setDeployedContract(response);
    } catch (exception: any) {
      let errorMessage = exception.toString();

      if (exception?.response?.data?.message) {
        errorMessage = exception?.response?.data?.message;
      } else if (errorMessage.includes('Network Error')) {
        errorMessage = 'Error: Request failed with status code 404';
      }

      setDeploymentError(errorMessage);
    }

    setLoading(false);
  }

  const isDevnet = () => selectedNetwork === 'devnet';

  const deployScript = async () => {
    await remixClient.call('fileManager', 'writeFile', contractDirectory, JSON.stringify(compiledContract));
    if (!scriptFileName) setScriptFileName(defaultScriptFileName);
    remixClient.call('fileManager', 'writeFile', `${deployScriptDirectory}/${scriptFileName || defaultScriptFileName}`, DeployScriptContent).then(() => setScriptStatus(true));
  }

  const changeScriptFileName = (value: string) => {
    setScriptFileName(value);
    setScriptStatus(false);
  }

  const devnetUrlChange = (value: string) => {
    setDevnetBaseUrl(value);
    setDevnetBaseUrlError(false);
  }

  return (
    <div className="container">
      <div role="button" aria-disabled={noFileSelected|| !currentFileName} onClick={compileContract}>{
        compiling ? `Compiling ${currentFileName}...` : `Compile ${currentFileName}`
      }</div>
      {noFileSelected  || !currentFileName ? <p>Please select file containing Cairo contract</p> : null}
      {compiledContract ? (
        <>
          <div className='networkSelect'>
            <label>STARKNET NETWORK</label>
            <select value={selectedNetwork} onChange={(event) => setSelectedNetwork(event.target.value as NetworkName)}>
              <option value="mainnet-alpha">mainnet-alpha</option>
              <option value="goerli-alpha">goerli-alpha</option>
              <option value="devnet">Deploy to Local Devnet</option>
            </select>
          </div>
          {
            isDevnet()
            ? <div className='devnetBaseUrl'>
                <label>Devnet URL</label>
                  <input value={devnetBaseUrl} onChange={(event) => devnetUrlChange(event.target.value)} type="text"/>
                  {(devnetBaseUrlError) ?  <Error message="Please check Devnet URL: The url should be only with https protocol" /> : null}

              </div>
            : null
          }
          {constructorInputs ? <ConstructorInputsForm inputs={constructorInputs} onInputValueChange={(data: any) => setConstructorInputValues(data)} /> : null}
          <div role="button" aria-disabled={isDevnet() && !devnetBaseUrl} onClick={deployContract}>Deploy</div>
          {deployIsLoading ? <p>Deploying...</p> : null}

          {deployedContract && !deployIsLoading ? 
            <>
              <p>Deployed contract address</p>
              <p className="contractAddress">{deployedContract.address}</p>
              <p>Tx Hash</p>
              <p className="contractAddress">{deployedContract.transaction_hash}</p>
              {!isDevnet() ? <p><a href={`${voyagerBasePaths[selectedNetwork]}/${deployedContract.address}`} target="_blank" rel="noreferrer" >View on Voyager</a></p> : null}
            </>
          : null}
          {(deploymentError) ?  <Error message={deploymentError} /> : null}
          <div className='deployScriptName'>
            <label>SCRIPT FILE NAME</label>
              <input value={scriptFileName} placeholder={defaultScriptFileName} onChange={(event) => changeScriptFileName(event.target.value)} type="text"/>
          </div>
          
        </>
      ) : null}

      {compiledContract ? <div role="button" onClick={deployScript}>Create deploy script</div> : null}

      {hasCreatedScript ? <p>Created script at {`${deployScriptDirectory}/${scriptFileName}`}</p> : null}

      {(compilationErrorTrace) ?  <Error message={compilationErrorTrace} /> : null}
    </div>  
  )
}

export default App
