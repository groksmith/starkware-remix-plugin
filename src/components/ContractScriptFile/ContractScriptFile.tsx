import { useState } from 'react'
import './ContractScriptFile.css'
import { DeployScriptContent, deployScriptDirectory, defaultScriptFileName, contractDirectory } from '../../helpers/common'

interface ContractScriptFileProps{
  remixClient: any,
  compiledContract: any
}


function ContractScriptFile(props: ContractScriptFileProps) {
  const {remixClient, compiledContract} = props;
  const [scriptFileName, setScriptFileName] = useState(defaultScriptFileName);
  const [hasCreatedScript, setScriptStatus] = useState(false);
  
  const createScriptFile = async () => {
    if (!scriptFileName) setScriptFileName(defaultScriptFileName);
    await remixClient.call('fileManager', 'writeFile', contractDirectory, JSON.stringify(compiledContract));
    await remixClient.call('fileManager', 'writeFile', `${deployScriptDirectory}/${scriptFileName || defaultScriptFileName}`, DeployScriptContent()).then(() => setScriptStatus(true));
  }

  const changeScriptFileName = (value: string) => {
    setScriptFileName(value);
    setScriptStatus(false);
  }

  return (
    <>
      <div className='deployScriptName'>
        <label>SCRIPT FILE NAME</label>
        <input className="scriptFileNameInput form-control" value={scriptFileName} placeholder={defaultScriptFileName} onChange={(event) => changeScriptFileName(event.target.value)} type="text"/>
      </div>
      {compiledContract ? <button className="createScriptFile btn btn-primary btn-block d-block w-100 text-break" onClick={() => createScriptFile()}>Create deploy script</button> : null}
      {hasCreatedScript ? <p className="createdScriptPath">Created script at {`${deployScriptDirectory}/${scriptFileName}`}</p> : null}
    </>
  )
}

export default ContractScriptFile
