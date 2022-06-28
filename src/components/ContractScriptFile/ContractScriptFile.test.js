import renderer from 'react-test-renderer';
import ContractScriptFile from './ContractScriptFile';
import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'

const remixClient = createClient(new PluginClient())

describe("Testing Contract Script File Component", ()=> {

  const props = {
    remixClient, 
    compiledContract: {}
  }

  it("It should change contract script file name", () => {
    const testInstance = renderer.create(<ContractScriptFile {...props} />).root;
    const mockInputValue = "testPath.js";

    renderer.act(() => {
      testInstance.findByProps({className: "scriptFileNameInput"}).props.onChange({target: {value: mockInputValue}});
    });

    expect(testInstance.findByProps({className: "scriptFileNameInput"}).props.value).toEqual(mockInputValue);
  });
})
