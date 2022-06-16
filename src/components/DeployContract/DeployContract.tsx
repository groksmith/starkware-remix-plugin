import { useState } from 'react'
import './DeployContract.css'
import { NetworkName, ContractType, NetworkBaseUrls } from '../../helpers/common';
import ConstructorInputsForm from '../ConstructorInputsForm/ConstructorInputsForm';
import ContractInfo from '../ContractInfo/ContractInfo';
import { randomAddress } from 'starknet/dist/utils/stark';
import Error from '../CompilationError/CompilationError';

interface DeployContractProps{
  selectedNetwork: NetworkName,
  compiledContract: ContractType | null
  constructorInputs: any
  isDevnet: any
}

function DeployContract(props: DeployContractProps) {
  const {isDevnet, selectedNetwork, compiledContract, constructorInputs} = props;
  const [devnetBaseUrl, setDevnetBaseUrl] = useState<string>('');
  const [devnetBaseUrlError, setDevnetBaseUrlError] = useState<boolean>(false);
  const [deploymentError, setDeploymentError] = useState<any>(false);
  const [deployIsLoading, setLoading] = useState(false);
  const [deployedContract, setDeployedContract] = useState<any>(undefined);
  const [constructorInputValues, setConstructorInputValues] = useState([]);

  const devnetUrlChange = (value: string) => {
    setDevnetBaseUrl(value);
    setDevnetBaseUrlError(false);
  }

  const requestAddTransaction = async (payload: any) => {
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

  const deployContract = async () => {
    if(!compiledContract || (isDevnet() && !devnetBaseUrl)) return;
    if (isDevnet() && !devnetBaseUrl.startsWith('https://')) return setDevnetBaseUrlError(true);

    setDeployedContract(undefined);
    setDeploymentError(null);
    setLoading(true);

    const transactionInputs = (constructorInputs || []).map((item: any)=> constructorInputValues[item.name] || null);

    const payload: any = {
      compiledContract: compiledContract,
      transactionInputs: transactionInputs
    };

    if(isDevnet()) {
      payload['baseUrl'] = devnetBaseUrl;
    } else {
      payload['network'] = selectedNetwork;
    }

    try {
      const response = await requestAddTransaction(payload);
      const responseData = await response.json();

      if(response.status === 200) {
        setDeployedContract(responseData);
      } else {
        transactionDeployError(responseData);
      }
    } catch (exception: any) {
      console.log(exception);
    }

    setLoading(false);
  }

  const transactionDeployError = (exception: any) => {
    let errorMessage = exception.toString();

    if (exception?.message) {
      errorMessage = exception?.message;
    } else if (errorMessage.includes('Network Error')) {
      errorMessage = 'Error: Request failed with status code 404';
    }

    setDeploymentError(errorMessage);
  }

  return (
    <>
      {
        isDevnet() &&
        <div className='devnetBaseUrl'>
          <label>Devnet URL</label>
            <input value={devnetBaseUrl} onChange={(event) => devnetUrlChange(event.target.value)} type="text"/>
            {(devnetBaseUrlError) ?  <Error message="Please check Devnet URL: The url should be only with https protocol" /> : null}
        </div>
      }

      {constructorInputs ? <ConstructorInputsForm inputs={constructorInputs} onInputValueChange={(data: any) => setConstructorInputValues(data)} /> : null}

      <div role="button" className="deployContract" aria-disabled={isDevnet() && !devnetBaseUrl} onClick={deployContract}>Deploy</div>
      {deployIsLoading ? <p className="deployingText">Deploying...</p> : null}

      {deployedContract && !deployIsLoading ? <ContractInfo isDevnet={isDevnet} selectedNetwork={selectedNetwork} deployedContract={deployedContract} />: null}
      {!!deploymentError &&  <Error message={deploymentError} />}
    </>
  )
}

export default DeployContract
