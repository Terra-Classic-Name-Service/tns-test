import { Coins, LCDClient, MsgStoreCode, MnemonicKey, isTxError } from '@terra-money/terra.js';
import * as fs from 'fs';
import fetch from 'isomorphic-fetch';

// const gasPrices =  await fetch('https://columbus-fcd.terra.dev/v1/txs/gas_prices');
// const gasPricesJson = await gasPrices.json();
const gasPricesJson = {"uluna":"28.325","usdr":"0.104938","uusd":"0.15","ukrw":"170.0","umnt":"428.571","ueur":"0.125","ucny":"0.98","ujpy":"16.37","ugbp":"0.11","uinr":"10.88","ucad":"0.19","uchf":"0.14","uaud":"0.19","usgd":"0.2","uthb":"4.62","usek":"1.25","unok":"1.25","udkk":"0.9","uidr":"2180.0","uphp":"7.6","uhkd":"1.17","umyr":"0.6","utwd":"4.0"};
const gasPricesCoins = new Coins(gasPricesJson); 

const mk = new MnemonicKey({
  mnemonic: ''
})

// connect to localterra
const terraMainnet = new LCDClient({
  URL: 'https://lcd.terra.dev/',
  chainID: 'columbus-5',
  gasPrices: gasPricesCoins,
  gasAdjustment: "1.5", // Increase gas price slightly so transactions go through smoothly.
  gas: 10000000,
});

const terraTestnet = new LCDClient({
  URL: 'https://lcd.terrac.dev/',
  chainID: 'rebel-2',
  gasPrices: gasPricesCoins,
  gasAdjustment: "1.5", // Increase gas price slightly so transactions go through smoothly.
  gas: 10000000,
});

const terra = terraTestnet;

const wallet = terra.wallet(mk);
console.log(wallet.key.accAddress);

async function storeCode2TerraClassic(filePath) {
  const storeCode = new MsgStoreCode(
    wallet.key.accAddress,
    fs.readFileSync(filePath).toString('base64')
  );
  const storeCodeTx = await wallet.createAndSignTx({
    msgs: [storeCode],
    feeDenoms: ['uluna']
  });
  const storeCodeTxResult = await terra.tx.broadcast(storeCodeTx);
  
  if (isTxError(storeCodeTxResult)) {
    throw new Error(
      `store code failed. code: ${storeCodeTxResult.code}, codespace: ${storeCodeTxResult.codespace}, raw_log: ${storeCodeTxResult.raw_log}`
    );
  }
  
  const {
    store_code: { code_id },
  } = storeCodeTxResult.logs[0].eventsByType;

  console.log(filePath, '=>', code_id);
}

const path = "/Users/mryu/blockchain/terra-classic/dapp/tns/artifacts/";
//const contractNames = ["controller.wasm", "registrar.wasm", "registry.wasm", "resolver.wasm"];

for (let i = 2; i < process.argv.length; i++) {
  const fileName = process.argv[i];
  const filePath = path + fileName;
  await storeCode2TerraClassic(filePath);
}

// controller.wasm => [ '6792' ]
// registrar.wasm => [ '6793' ]
// resolver.wasm => [ '6794' ]
// registry.wasm => [ '6795' ]