import { useState, useEffect } from 'react'
import './CompileContract.css'
import { ContractType } from '../../helpers/common';
import Error from '../CompilationError/CompilationError';

interface CompileContractProps{
  remixClient: any,
  onContractChange: any,
  onConstructorInputsChange: any
}

const cairoHostUrl : string = process.env.REACT_APP_CAIRO_HOST_URL || '';
const allowedFileExtensions = ['cairo'];

function CompileContract(props: CompileContractProps) {
  const {remixClient, onContractChange, onConstructorInputsChange} = props;
  const [currentFileName, setCurrentFileName] = useState('');
  const [noFileSelected, setNoFileSelected] = useState(false);
  const [compiling, setCompilingStatus] = useState(false);
  const [compilationErrorTrace, setCompilationErrorTrace] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      remixClient.on('fileManager', 'currentFileChanged', (currentFileChanged: any) => {
        console.log(currentFileChanged)
        const fileName = currentFileChanged.split('/').pop();
        const currentFileExtension = fileName.split('.').pop() || '';
        setNoFileSelected(!allowedFileExtensions.includes(currentFileExtension));
        setCurrentFileName(fileName);
      })
    }, 1000);
  }, [remixClient])

  const setCompilationError = async (error: any) => {
    setCompilationErrorTrace(error);
    const errorObject = error.split(':');
    const row = +errorObject[2];
    const column = +errorObject[3];

    if (isNaN(row) || isNaN(column)) return;
    await remixClient.editor.addAnnotation({ row: row-1, column: column, text: error, type: 'error' });
  }

  const compileContract = async () => {
    if (noFileSelected) return;

    onContractChange(null);
    onConstructorInputsChange(null);
    setNoFileSelected(false);
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
    if(currentFileContent.includes("%lang starknet")) {
      runContractCompilation(currentFileContent);
    } else  {
      setCompilationError('Error: code:1:1: The "%lang starknet" directive is missing. \n Only StarkNet contracts can be compiled.')
      setCompilingStatus(false)
    }
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
      onContractChange(responseData);
    } catch(exception) {
      console.error(exception);
    }
  }

  const defineConstructorInputs = (contractData: ContractType) => {
    const constructorResponse: any = contractData.contract_definition.abi.find(item=>item.name === "constructor");
    if (!constructorResponse || !constructorResponse?.inputs?.length) return;
    onConstructorInputsChange(constructorResponse.inputs);
  }

  return (
    <>
      <div role="button" className="compileContract" aria-disabled={noFileSelected|| !currentFileName} onClick={compileContract}>{
        compiling ? `Compiling ${currentFileName}...` : `Compile ${currentFileName}`
      }</div>
      {noFileSelected  || !currentFileName ? <p className="fileIsNotSelected">Please select file containing Cairo contract</p> : null}
      {(compilationErrorTrace) ?  <Error message={compilationErrorTrace} /> : null}
    </>
  )
}

export default CompileContract
