import { useState } from 'react'
import './DeployContract.css'
import { NetworkName, ProviderOptions, ContractType } from '../../helpers/common';
import ConstructorInputsForm from '../ConstructorInputsForm/ConstructorInputsForm';
import ContractInfo from '../ContractInfo/ContractInfo';
import { randomAddress } from 'starknet/dist/utils/stark';
import { Provider, } from 'starknet';
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
