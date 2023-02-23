import { Coins, LCDClient, MsgInstantiateContract, MnemonicKey, isTxError } from '@terra-money/terra.js';
import { namehash } from '../utils.js';
// import pkg from 'js-sha3';
// import pkgIdna from 'idna-uts46-hx';

// const { sha3_256: SHA256 } = pkg;
// const { toUnicode } = pkgIdna;

// const namehash = (inputName) => {
//   var node = ''
//   for (var i = 0; i < 32; i++) {
//     node += '00'
//   }

//   var name = normalize(inputName)

//   if (name) {
//     var labels = name.split('.')

//     for(var i = labels.length - 1; i >= 0; i--) {
//       var labelSha = SHA256(labels[i])
//       node = SHA256(new Buffer(node + labelSha, 'hex'))
//     }
//   }

//   return '0x' + node
// }

// function normalize(name) {
//   return name ? toUnicode(name, {useStd3ASCII: true, transitional: false}) : name
// }

//const gasPrices =  await fetch('https://columbus-fcd.terra.dev/v1/txs/gas_prices');
const gasPricesJson = {"uluna":"28.325","usdr":"0.52469","uusd":"0.75","ukrw":"850.0","umnt":"2142.855","ueur":"0.625","ucny":"4.9","ujpy":"81.85","ugbp":"0.55","uinr":"54.4","ucad":"0.95","uchf":"0.7","uaud":"0.95","usgd":"1.0","uthb":"23.1","usek":"6.25","unok":"6.25","udkk":"4.5","uidr":"10900.0","uphp":"38.0","uhkd":"5.85","umyr":"3.0","utwd":"20.0"};
const gasPricesCoins = new Coins(gasPricesJson); 


// test1 key from localterra accounts
const mk = new MnemonicKey({
  mnemonic: 'cave radio ski pelican hill road spawn shed teach measure arch cabbage crater model tray daring again aerobic female eagle bike skate dry vapor'
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

const terra = terraMainnet;

const wallet = terra.wallet(mk);

const contractNames = ['registry', 'resolver', 'registrar', 'controller'];

const contractAddrs = {'registry': 'terra12jjtksj6lwpsf8fjffx4gcw45ypl9s0ud92eff', 
                       'resolver': 'terra1ly97ft6g9lt5u24m8k2xh9u8n9epp03lgpf9wt',
                       'registrar': 'terra1er34wfk0hjpawtpfqp2kwfqaj9tm0aefl8uwce',
                       'controller': 'terra1sum7a9qy43lkxk29yv8tjnm2uevp6nwgcxdw62'}

const contractCodeId = {
    'controller': [6813],
    'registrar': [6866],
    'resolver': [6868],
    'registry': [6796]
}

/*
{
      "registrar_address": "terra178zzd6lyp7ucykjjep3zmlv8kun8xn7t08fxcr",
      "max_commitment_age": 3600,
      "min_commitment_age": 3,
      "min_registration_duration": 7776000,
      "tier1_price": 1000000,
      "tier2_price": 500000,
      "tier3_price": 250000,
      "enable_registration": true,
      "enable_public_mint": false,
      "start_time": 1673168358,
      "end_time": 1674032358,
      "phase": 1        
  }
*/
const initInfo = {
    'controller': {
        registrar_address: '',
        max_commitment_age: 3600,
        min_commitment_age: 30,
        min_registration_duration: 90 * 3600 * 24,
        tier1_price: 1000000,
        tier2_price: 500000,
        tier3_price: 250000,
        enable_registration: true,
        enable_public_mint: false,
        start_time: 1673168358,
        end_time: 1684032358,
        phase: 1        
    },
    'registrar': {
        registry_address: '',
        base_node: namehash('lunc').substr(2),
        base_name: 'lunc',
        reverse_node: namehash('reverse').substr(2),
        reverse_name: 'reverse',
        grace_period: 30 * 24 * 3600,
        name: 'Terra Name Service',
        symbol: 'TNS'
    },
    'registry': {
    },
    'resolver': {
      registry_address: '',
      interface_id: 1
    }
}

for (let i =0; i < contractNames.length; i++) {
  const contractName = contractNames[i];
  if (contractAddrs[contractName] != null && contractAddrs[contractName] != '') continue;

  console.log('start init ', contractName);
  const codeId = contractCodeId[contractName];
  const initMsg = initInfo[contractName];
  if (contractName == 'controller') {
    initMsg.registrar_address = contractAddrs['registrar'];
  } else if (contractName == 'registrar') {
    initMsg.registry_address = contractAddrs['registry'];
  } else if (contractName == 'resolver') {
    initMsg.registry_address = contractAddrs['registry'];
  } 
  console.log(initMsg);
  await initContract(contractName, codeId, initMsg);
}

async function initContract(contractName, codeId, initMsg) {
  const instantiate = new MsgInstantiateContract(
    wallet.key.accAddress,
    '',
    +codeId, // code ID
    initMsg, // InitMsg
    {}, // init coins
    false // migratable
  );

  const instantiateTx = await wallet.createAndSignTx({
    msgs: [instantiate],
    feeDenoms: ['uluna']
  });
  const instantiateTxResult = await terra.tx.broadcast(instantiateTx);

  console.log(contractName, instantiateTxResult.txhash);

  if (isTxError(instantiateTxResult)) {
    throw new Error(
      `store code failed. code: ${instantiateTxResult.code}, codespace: ${instantiateTxResult.codespace}, raw_log: ${instantiateTxResult.raw_log}`
    );
  }

  const {
      instantiate_contract: { contract_address },
  } = instantiateTxResult.logs[0].eventsByType;

  contractAddrs[contractName] = contract_address;
  console.log(contractName, contract_address);
}
