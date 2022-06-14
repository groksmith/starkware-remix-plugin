import renderer from 'react-test-renderer';
import ContractInfo from './ContractInfo';

describe("Testing Contract Info Component", ()=> {

  const props = {
    deployedContract: {
      transaction_hash: 'transaction_hash',
      address: 'transaction_hash'
    }, 
    isDevnet: () => false, 
    selectedNetwork: 'goerli-alpha'
  }

  it("It should show deployed contract transaction hash", () => {
    const testInstance = renderer.create(<ContractInfo {...props} />).root;

    expect(testInstance.findByProps({className: "contractTransactionHash"}).children).toEqual([props.deployedContract.transaction_hash]);
  });

  it("It should show deployed contract address", () => {
    const testInstance = renderer.create(<ContractInfo {...props} />).root;

    expect(testInstance.findByProps({className: "contractAddress"}).children).toEqual([props.deployedContract.address]);
  });

  it("It should show View on Voyager link", () => {
    const testInstance = renderer.create(<ContractInfo {...props} />).root;

    expect(testInstance.findByProps({className: "viewOnVoyagerLink"})).toBeTruthy();
  });
})
