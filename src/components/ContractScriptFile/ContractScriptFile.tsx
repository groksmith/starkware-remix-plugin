import { useState } from 'react'
import './ContractScriptFile.css'
import { DeployScriptContent } from '../../helpers/common'

interface ContractScriptFileProps{
  remixClient: any,
  compiledContract: any
}

const deployScriptDirectory = './scripts';
const defaultScriptFileName = 'deploy.js';
const contractDirectory = 'compiled_cairo_artifacts/contract.json';

function ContractScriptFile(props: ContractScriptFileProps) {
  const {remixClient, compiledContract} = props;
  const [scriptFileName, setScriptFileName] = useState(defaultScriptFileName);
  const [hasCreatedScript, setScriptStatus] = useState(false);

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
    <>
      <div className='deployScriptName'>
        <label>SCRIPT FILE NAME</label>
        <input value={scriptFileName} placeholder={defaultScriptFileName} onChange={(event) => changeScriptFileName(event.target.value)} type="text"/>
      </div>
      {compiledContract ? <div role="button" onClick={deployScript}>Create deploy script</div> : null}
      {hasCreatedScript ? <p>Created script at {`${deployScriptDirectory}/${scriptFileName}`}</p> : null}
    </>
  )
}

export default ContractScriptFile
