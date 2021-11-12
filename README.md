## Implementation details

This plugin aims for having smart contracts which are written in Cairo to be compilied and then deployed.

Ways to run the plugin on the local machine

`yarn install`

`yarn dev`

Then it will run the plugin on `localhost:3000`
Go to the Remix plugin section, add new plugin from localhost, name it, and inside the URL section paste `https://localhost:3000`, check `iframe` and `Side Panel`. 

Click `ok`, now you can see a new plugin in plugin section which has question mark icon. Click on it, now you are inside the plugin.

But before this couple of fixes to do

All the Remix plugins have wrong interface file path inside their own `package.json`

You can find them in `node_modules/@remixproject`

There are 4 projects there `plugin`, `plugin-api`, `plugin-utils` and `plugin-webview`

All 4 of them have wrong interface links, so go inside everyone of them, locate `node_modules/@remixproject/*/package.json` and update  `main` and `typings` field to point to `index.js` and `index.d.ts` instead of `src/index.ts`

Example below

```diff
  {
-      main: "/src/index.js"
-      typings: "/src/index.d.ts"
+      main: "index.js",
+      typings: "index.d.ts"
  }
```