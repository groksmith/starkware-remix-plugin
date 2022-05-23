## Implementation details

This plugin aims for having smart contracts which are written in Cairo to be compiled and then deployed.

Ways to run the plugin on the local machine

`yarn install`

`yarn start`

Then it will run the plugin on `localhost:3000`
Go to the Remix plugin section, add new plugin from localhost, name it, and inside the URL section paste `https://localhost:3000`, check `iframe` and `Side Panel`. 

Click `ok`, now you can see a new plugin in plugin section which has question mark icon. Click on it, now you are inside the plugin.

## Documentation

Welcome to the starkware-remix-plugin!

This plugin will help you to compile cairo contracts and deploy them to starknet from Starkware.
It has a very good potential to be an integrated workflow when working with smart contracts inside Remix IDE.

1. Open the plugin (you will see compile button).
2. Select any file containing cairo smart contracts.
3. Hit compile.
4. After compilation is finished you will see a network dropdown and deploy.
5. Choose your desired network from starknet.
6. Deploy! 

Additionally, you can generate example script to interact with the compiled contract. This is very handy when developers want to have interaction between contracts. Or just hack their way through.

To run plugins locally, please refer to [official Remix IDE documentation.](https://remix-ide.readthedocs.io/en/latest/plugin_manager.html?highlight=connect%20to%20local%20plugin#plugin-devs-load-a-local-plugin)
