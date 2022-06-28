import renderer from 'react-test-renderer';
import ConstructorInputsForm from './ConstructorInputsForm';


describe("Testing Compile Contract Component", ()=> {
  const mockOnInputValueChange = jest.fn()
  const mockInputData = [
    {
      type: 'felt',
      name: 'Argument 1'
    },
    {
      type: 'felt',
      name: 'Argument 2'
    }
  ]

  const props = {
    inputs: mockInputData,
    onInputValueChange: mockOnInputValueChange
  }

  it("It should show two inputs based on mock data", () => {
    const testInstance = renderer.create(<ConstructorInputsForm {...props} />).root;
    expect(testInstance.findAllByProps({className: "constructorInput"}).length).toEqual(2);
  });

  it("It should call onInputValueChange once the value of input is changed", () => {
    const testInstance = renderer.create(<ConstructorInputsForm {...props} />).root;
    const mockInputValue = "Test Input Value";
    const mockCallbackArgument = {"Argument 1": mockInputValue};

    renderer.act(() => {
      testInstance.findAllByType('input')[0].props.onChange({target: {value: mockInputValue}});
    });

    expect(testInstance.findAllByType('input')[0].props.value).toEqual(mockInputValue);
    expect(mockOnInputValueChange).toHaveBeenCalledWith(mockCallbackArgument);
  });
})
