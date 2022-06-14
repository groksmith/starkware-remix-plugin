import renderer from 'react-test-renderer';
import DeployContract from './DeployContract';
import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'

const remixClient = createClient(new PluginClient())

describe("Testing Deploy Contract Component", ()=> {

  const props = {
    isDevnet: () => false, 
    selectedNetwork: 'goerli-alpha',
    compiledContract: {},
    constructorInputs: [
      {
        type: 'felt',
        name: 'Argument 1'
      },
      {
        type: 'felt',
        name: 'Argument 2'
      }
    ]
  }

  it("It should contain deploy contract button", () => {
    const testInstance = renderer.create(<DeployContract {...props} />).root;
    expect(testInstance.findByProps({className: "deployContract"})).toBeTruthy();
  });
})
