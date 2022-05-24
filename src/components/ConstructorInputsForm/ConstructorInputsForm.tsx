import { useState } from 'react'
import './ConstructorInputsForm.css'

interface ConstructorInputsFormProps{
  inputs: any,
  onInputValueChange: any
}

function ConstructorInputsForm(props: ConstructorInputsFormProps) {
  const {inputs, onInputValueChange} = props;
  const [inputValues, setInputValues] = useState<any>({});

  const storeInputValue = (value: string, key: string) => {
    const newInputValues = {...inputValues, [key]: value};
    setInputValues(newInputValues);
    onInputValueChange(newInputValues);
  }

  return (
    <div className="constructorInputsFormContainer">
      <label>CONTRACT CONSTRUCTOR ARGUMENTS</label>
      {inputs.map((input: any)=>(
        <div key={input.name}>
          <label className="argumentLabel">{input.name}</label>
          <input type="text" value={inputValues[input.name] || ''} onChange={(event) => storeInputValue(event.target.value, input.name)}></input>
        </div>
      ))}
    </div>  
  )
}

export default ConstructorInputsForm
