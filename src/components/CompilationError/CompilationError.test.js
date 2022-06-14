import renderer from 'react-test-renderer';
import CompilationError from './CompilationError';

describe("Testing Compilation Error Component", ()=> {
  it("It should show error message blob when message prop is passed", () => {
    const fakeErrorMessage = "Error Message";
    const testInstance = renderer.create(<CompilationError message={fakeErrorMessage} />).root;
    expect(testInstance.findByProps({className: "errorContent"}).children).toEqual([fakeErrorMessage]);
  });
})