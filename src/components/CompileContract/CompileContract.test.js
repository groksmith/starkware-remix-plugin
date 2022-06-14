import renderer from 'react-test-renderer';
import CompileContract from './CompileContract';
import { createClient } from '@remixproject/plugin-webview'
import { PluginClient } from '@remixproject/plugin'

const remixClient = createClient(new PluginClient())

describe("Testing Compile Contract Component", ()=> {
  const mockOnContractChange = jest.fn();
  const onConstructorInputsChange = jest.fn();

  const props = {
    remixClient: remixClient,
    onContractChange: mockOnContractChange,
    onConstructorInputsChange: onConstructorInputsChange
  }

  it("It should call mockOnContractChange when contract is compiled", () => {
    const testInstance = renderer.create(<CompileContract {...props} />).root;

    renderer.act(() => {
      testInstance.findByProps({className: "compileContract"}).props.onClick();
    });

    expect(mockOnContractChange).toHaveBeenCalled();
  });

  it("It should show error if contract is not selected", () => {
    const testInstance = renderer.create(<CompileContract {...props} />).root;

    renderer.act(() => {
      testInstance.findByProps({className: "compileContract"}).props.onClick();
    });
    expect(testInstance.findByProps({className: "fileIsNotSelected"}).children).toBeTruthy();
  });
})
