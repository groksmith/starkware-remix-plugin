import './ContractInfo.css'
import { NetworkName, VoyagerBasePaths } from '../../helpers/common';

interface ContractInfoProps{
  deployedContract: any,
  selectedNetwork: NetworkName,
  isDevnet: any
}

function ContractInfo(props: ContractInfoProps) {
  const {deployedContract, isDevnet, selectedNetwork} = props;
  
  return (
    <>
      <p>Deployed contract address</p>
      <p className="contractAddress">{deployedContract.address}</p>
      <p>Tx Hash</p>
      <p className="contractAddress">{deployedContract.transaction_hash}</p>
      {!isDevnet() ? <p><a href={`${VoyagerBasePaths[selectedNetwork]}/${deployedContract.address}`} target="_blank" rel="noreferrer" >View on Voyager</a></p> : null}
    </>
  )
}

export default ContractInfo
