import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'
import { useState } from 'react'
import { NetworkName, ContractType } from './helpers/common';
import ContractScriptFile from './components/ContractScriptFile/ContractScriptFile';
import DeployContract from './components/DeployContract/DeployContract';
import CompileContract from './components/CompileContract/CompileContract';

import './App.css'

const remixClient = createClient(new PluginClient())

function App() {
  const [compiledContract, setContract] = useState<ContractType | null>(null);
  const [constructorInputs, setConstructorInputs] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>('goerli-alpha');
  const isDevnet = () => selectedNetwork === 'devnet';

  return (
    <div className="container">
      <CompileContract remixClient={remixClient} onConstructorInputsChange={(data: any) => setConstructorInputs(data)} onContractChange={(contract: ContractType | null) => setContract(contract)} />
      
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
          <DeployContract compiledContract={compiledContract} selectedNetwork={selectedNetwork} constructorInputs={constructorInputs} isDevnet={isDevnet} />
          <ContractScriptFile remixClient={remixClient} compiledContract={compiledContract}/>
        </>
      ) : null}
    </div>  
  )
}

export default App
