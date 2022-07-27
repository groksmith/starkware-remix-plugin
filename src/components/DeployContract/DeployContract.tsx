import { useState } from 'react'
import './DeployContract.css'
import { NetworkName, ContractType } from '../../helpers/common';
import { addTransaction } from '../../helpers/addTransaction';
import ConstructorInputsForm from '../ConstructorInputsForm/ConstructorInputsForm';
import ContractInfo from '../ContractInfo/ContractInfo';
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
      const response = await addTransaction(payload);
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
            <input value={devnetBaseUrl} className="form-control" onChange={(event) => devnetUrlChange(event.target.value)} type="text"/>
            {(devnetBaseUrlError) ?  <Error message="Please check Devnet URL: The url should be only with https protocol" /> : null}
        </div>
      }

      {constructorInputs ? <ConstructorInputsForm inputs={constructorInputs} onInputValueChange={(data: any) => setConstructorInputValues(data)} /> : null}

      <button className="deployContract btn btn-primary btn-block d-block w-100 text-break" aria-disabled={isDevnet() && !devnetBaseUrl} onClick={deployContract}>Deploy</button>
      {deployIsLoading ? <p className="deployingText">Deploying...</p> : null}

      {deployedContract && !deployIsLoading ? <ContractInfo isDevnet={isDevnet} selectedNetwork={selectedNetwork} deployedContract={deployedContract} />: null}
      {!!deploymentError &&  <Error message={deploymentError} />}
    </>
  )
}

export default DeployContract
