import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
  useLCDClient,
  useWallet,
} from '@terra-money/wallet-provider';
import { Coins, Fee, MsgExecuteContract } from "@terra-money/terra.js"
import React, { useCallback, useState } from 'react';
import { MerkleTree } from 'merkletreejs';
import pkg from 'js-sha3';
import { namehash } from 'utils.js';
import '../style.css';

const { sha3_256: SHA256 } = pkg;

const contractAddrs = {'registry': 'terra1f8zucu5l90kvxlsakhv2x5n8rge330mdhmpxrd', 
                       'resolver': 'terra1mmfuq42y9yv9v3uc9s9xuq7tl9wwkf5ruuars0',
                       'registrar': 'terra1zamqfsexrm532neavkqscrckjeajcvyf6dnhem',
                       'controller': 'terra1t7pqe4xvjkls8u64n47jdd58c9tgfem5jsye87'}

const secret = 'luncid';

const chainID = 'columbus-5';

export function TNS() {
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);
  const [mintInfo, setMintInfo] = useState(null);
  const [commitConfigInfo, setCommitConfigInfo] = useState(null);
  const [minRegisterDuration, setMinRegisterDuration] = useState(null);
  const [price, setPrice] = useState(null);
  const [registrarAddr, setRegistrarAddr] = useState(null);
  const [registrarConfig, setRegistrarConfig] = useState(null);
  const [registrarBaseNode, setRegistrarBaseNode] = useState(null);
  const [registrarReverseNode, setRegistrarReverseNode] = useState(null);
  const [didName, setDidName] = useState(null);
  const [duration, setDuration] = useState(31536000);
  const [nodeInfo, setNodeInfo] = useState(null);
  const [commitment, setCommitment] = useState(null);
  const [validRegisterTime, setValidRegisterTime] = useState(null);
  const [rentPrice, setRentPrice] = useState(0);
  const [rootHash, setRootHash] = useState('');
  const [proof, setProof] = useState('');
  const [nameRegisterableInfo, setNameRegisterableInfo] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [isEnablePublicMint, setIsEnablePublicMint] = useState(false);
  const [isEnableRegistration, setIsEnableRegistration] = useState(false);
  const [expireTime, setExpireTime] = useState(0);
  const [nftInfo, setNftInfo] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [numTokens, setNumTokens] = useState(0);
  const [myNFTs, setMyNFTs] = useState([]);
  const [allNFTs, setAllNFTs] = useState([]);
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [terraAddress, setTerraAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [tokenIdOfNode, setTokenIdOfNode] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const connectedWallet = useConnectedWallet();
  //const { status, network, wallets } = useWallet();
  //console.log(JSON.stringify({status, network, wallets}));
  
  const lcd = useLCDClient();
  // new LCDClient({
  //   lcd: "https://columbus-lcd.terra.dev/",
  //   chainID: "columbus-5",
  //   gasPrices: gasPricesCoins,
  //   gasAdjustment: "1.5",
  //   gas: 10000000,
  // }) 

  const defaultConfig = {
    "owner": connectedWallet?.terraAddress,
    "registrar_address": contractAddrs['registrar'],
    "max_commitment_age": 3600,
    "min_commitment_age": 30,
    "min_registration_duration": 90 * 3600 * 24,
    "tier1_price": 1000000,
    "tier2_price": 500000,
    "tier3_price": 250000,
    "enable_registration": true,
    "enable_public_mint": false,
    "start_time": 1673168358,
    "end_time": 1678822400,
    "phase": 1,
    "root": '31bfc69699d8a0d3363d7ebafded7f16bab9895003a0205512deb7e75c9894c3'
  }

  const whitelistStr = "terra1hh9406qg4a3c62t2txthzcjdf5r4w960td09gc;terra1q43hd97ru800y6mmkwemrhlhnwsn2re2y3fx92;terra1yydvkwm70lswqwsp9atvqk0789prk77nk29pjw;terra1wrrds522sh74d26tp0r4fgj0v5e3npvlv7luch;terra1772z9xeswzar3jq38mgsqvdnw97vkp26vhgf54;terra1tc4jxccs8x5hdzfddl2dzmae6v6m8ksjscqy6h;terra1uvea9l99d27wm8ljvxsdyjz5c8f5eyv4x9shzh";
  
  let proofString = '';

  const getTxFee = async (msg, txAmount) => {
    try {
      let taxAmountCoins = new Coins({ uluna : 0 });

      const gasPrices =  await fetch('https://columbus-fcd.terra.dev/v1/txs/gas_prices');

      const gasPricesJson = await gasPrices.json();
      const gasPricesCoins = new Coins(gasPricesJson); 

      if (txAmount != null && txAmount > 0) {
        // const taxRateRaw = await fetch("https://rebel1.grouptwo.org/terra/treasury/v1beta1/tax_rate");
        // const taxRate = await taxRateRaw.json();
        // const taxCapRaw = await fetch("https://rebel1.grouptwo.org/terra/treasury/v1beta1/tax_caps/uluna");
        // const taxCap = await taxCapRaw.json();
        
        const taxRate = '0.002';
        const taxCap = "60000000000000000";
        const taxAmount = Math.min(Math.ceil(txAmount * parseFloat(taxRate)), parseInt(taxCap));
        taxAmountCoins = new Coins({ uluna : taxAmount });
      }

      const accountInfo = await lcd.auth.accountInfo(connectedWallet?.terraAddress);
      
      var txFee = await lcd.tx.estimateFee(
        [{ sequenceNumber: accountInfo.sequence }],
        { 
          msgs: [msg], 
          // gasPrices: new Coin('uluna', '28.325'), 
          // gasAdjustment: 3, 
          feeDenoms: ["uluna"]
        }
      );
      const amount = parseInt(txFee.gas_limit * gasPricesJson['uluna'] * 1.5);//txFee.amount.add(taxAmountCoins);

      return new Fee(txFee.gas_limit, amount + 'uluna');
    } catch (error) {
      console.log(error.response.data.message);
      console.log('Tx simulate execute fail, you would better NOT broadcast it to the chain');      
      return new Fee(2000000, '60000000uluna');
    }
  }

  const setConfig = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    const config = JSON.parse(document.getElementById("config")?.textContent);
    const executeMsg = {set_config: config};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });
    
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: new Fee(txFee.gas_limit, txFee.amount),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);
  
  const setEnablePublicMint = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    const executeMsg = {set_enable_public_mint: {enable_public_mint: isEnablePublicMint}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      }
    );
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, isEnablePublicMint]);
  
  const withdrawFund = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    const executeMsg = {
      withdraw: {
        amount: withdrawAmount
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });
    
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, withdrawAmount]);

  const setResolvedTerraAddr = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    let nodeInfo = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_node_info: {name: didName}});  
    const node = [...new Uint8Array(nodeInfo.node)];

    const executeMsg = {set_terra_address: {node, address: terraAddress}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['resolver'],
      {
        ...executeMsg
      });
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, terraAddress, didName]);

  const transferNFT = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    
    const tokenId = await getTokenId(didName);

    const executeMsg = {transfer_nft: {recipient: toAddress, token_id: tokenId}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['registrar'],
      {
        ...executeMsg
      });
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, toAddress, didName]);

  const setEnableRegistration = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    const executeMsg = {set_enable_registration: {enable_registration: isEnableRegistration}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);

  const setRoot = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }
    const whitelist = (document.getElementById("whitelist")?.textContent).split(";");
    const leaves = whitelist.map(x => SHA256(x))
    const tree = new MerkleTree(leaves, SHA256, {sortPairs: true})
    const root = tree.getRoot().toString('hex')
    
    const executeMsg = {
      set_root: {
        root
      }
    };

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });
    
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);
  
  const addController = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }
    const executeMsg = {
      add_controller: {
        address: contractAddrs['controller']
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['registrar'],
      {
        ...executeMsg
      });
  
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);

  const setSubnodeOwner = useCallback(async (name) => {
    if (!connectedWallet) {
      return;
    }

    const tokenId = await getTokenId(name);
    const tokenIdBuffer = new Uint8Array(hex2ab(tokenId));
    const nodeBuffer = new Uint8Array(hex2ab('0000000000000000000000000000000000000000000000000000000000000000'));
    const executeMsg = {
      set_subnode_owner: {
        node: [...nodeBuffer],
        label: [...tokenIdBuffer],
        owner: contractAddrs['registrar']
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['registry'],
      {
        ...executeMsg
      });
  
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);

  const setSubnodeOwnerOfLunc = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    const tokenId = await getTokenId('lunc');
    const tokenIdBuffer = new Uint8Array(hex2ab(tokenId));
    const nodeBuffer = new Uint8Array(hex2ab('0000000000000000000000000000000000000000000000000000000000000000'));
    const executeMsg = {
      set_subnode_owner: {
        node: [...nodeBuffer],
        label: [...tokenIdBuffer],
        owner: contractAddrs['registrar']
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['registry'],
      {
        ...executeMsg
      });
  
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet]);

  const commit = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }
    
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const commitmentStr = await getCommitment();
    
    const executeMsg = {
      commit: {
        commitment: commitmentStr
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });
  
    const txFee = await getTxFee(conctractMsg);
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, didName]);

  const register_whitelist = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }

    const proof = getProof(true);
    //const cost = await getRentPrice(true);
    
    const executeMsg = {
      register_whitelist: {
        name: didName,
        owner: connectedWallet?.terraAddress,
        duration,
        secret,
        resolver: contractAddrs['resolver'],
        address: connectedWallet?.terraAddress,
        proof,
        reverse_record: true
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      },
      {uluna: parseInt(rentPrice.toString())});

    const txFee = await getTxFee(conctractMsg, parseInt(rentPrice.toString()));
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, rentPrice]);

  const register_public = useCallback(async () => {
    if (!connectedWallet) {
      return;
    }
    const executeMsg = {
      register: {
        name: didName,
        owner: connectedWallet?.terraAddress,
        duration,
        secret,
        resolver: contractAddrs['resolver'],
        address: connectedWallet?.terraAddress,
        reverse_record: true
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet?.terraAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      },
      {uluna: parseInt(rentPrice.toString())});

    const txFee = await getTxFee(conctractMsg, parseInt(rentPrice.toString()));
    connectedWallet.post({
        fee: txFee,
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error) => {
        if (error instanceof UserDenied) {
          setTxError('User Denied');
        } else if (error instanceof CreateTxFailed) {
          setTxError('Create Tx Failed: ' + error.message);
        } else if (error instanceof TxFailed) {
          setTxError('Tx Failed: ' + error.message);
        } else if (error instanceof Timeout) {
          setTxError('Timeout');
        } else if (error instanceof TxUnspecifiedError) {
          setTxError('Unspecified Error: ' + error.message);
        } else {
          setTxError(
            'Unknown Error: ' +
              (error instanceof Error ? error.message : String(error)),
          );
        }
      });
  }, [connectedWallet, rentPrice, didName]);

  const getRoot = () => {
    const whitelist = (document.getElementById("whitelist")?.textContent).split(";");
    const leaves = whitelist.map(x => SHA256(x));
    const tree = new MerkleTree(leaves, SHA256, {sortPairs: true});
    const root = tree.getRoot().toString('hex');
    setRootHash(root);
    return root;
  }

  const getProof = (hide) => {
    const whitelist = (document.getElementById("whitelist")?.textContent).split(";");
    const leaves = whitelist.map(x => SHA256(x))
    const tree = new MerkleTree(leaves, SHA256, {sortPairs: true})
    const leaf = SHA256(connectedWallet?.terraAddress.toString());
    const proof = tree.getProof(leaf);
    if (proof.length == 0) {
      alert('Your account is NOT in whitelist');
    }
    proofString = "";
    proof.forEach(p => {
      proofString += p.data.toString('hex') + ":";
    })
    proofString = proofString.substring(0, proofString.length - 1);
    setProof(proofString);
    return proofString;
  };

  const getConfig = async () => {
    console.log('getConfig 1', lcd);
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_mint_info: {}});
    console.log('getConfig 2', result);
    const mintInfo = JSON.parse(JSON.stringify(result));
    mintInfo.start_time = new Date(mintInfo.start_time * 1000).toLocaleString();
    mintInfo.end_time = new Date(mintInfo.end_time * 1000).toLocaleString();
    setMintInfo(JSON.stringify(mintInfo));
  }

  const getCommitmentInfo = async () => {
    const minCommit = await lcd.wasm.contractQuery(contractAddrs['controller'], {min_commitment_age: {}});
    const maxCommit = await lcd.wasm.contractQuery(contractAddrs['controller'], {max_commitment_age: {}});
    setCommitConfigInfo(JSON.stringify({minAge: JSON.parse(JSON.stringify(minCommit)).age, maxAge: JSON.parse(JSON.stringify(maxCommit)).age}));
  }

  const getMinRegistrationDuration = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {min_registration_duration: {}});
    setMinRegisterDuration(JSON.stringify(result));
  }

  const getPrice = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_price: {}});
    setPrice(JSON.stringify(result));
  }

  const getRegistarAddr = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {registrar: {}});
    setRegistrarAddr(JSON.stringify(result));
  }

  const getRegistarConfig = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {get_config: {}});
    setRegistrarConfig(JSON.stringify(result));
  }

  const getRegistarBaseNode = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {get_base_node: {}});
    setRegistrarBaseNode(JSON.stringify(result));
  }

  const getRegistarReverseNode = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {get_reverse_node: {}});
    setRegistrarReverseNode(JSON.stringify(result));
  }

  const checkNameRegisterable = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    console.log('check name valid')
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {is_valid_name: {name: didName}});    
    if(!result['is_valid_name']) {
      setNameRegisterableInfo("name should be constructed by a~z 0~9, and length >=3");
      return;
    }
    console.log('check name commitment')
    let hasCommitted = false;
    try {
      await getCommitment();
      console.log(commitment);
      const maxCommitmentTime = await getCommitmentTimestamp();
      if (maxCommitmentTime * 1000 > new Date().getTime()) {
        hasCommitted = true;
      }
    } catch (error) {
      console.log('no commitment')
    }
    console.log('check name available')
    const available = await isAvailableName();
    if (!available) {
      setNameRegisterableInfo(didName + " has been registered");
      return;
    }
    setNameRegisterableInfo(didName + ' can be registered now, and commitment has ' + (hasCommitted ? 'been committed' : 'NOT been committed.'));
  }

  const isAvailableName = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const tokenId = await getTokenId(didName);
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {is_available: {id: tokenId}});  
    return result.available;
  }

  const getExpires = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const tokenId = await getTokenId(didName);
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {get_expires: {id: tokenId}});  
    setExpireTime(result.expires);
    return result.expires;
  }

  const getNFTInfo = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const tokenId = await getTokenId(didName);
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {nft_info: {token_id: tokenId}});  
    console.log(result);
    setNftInfo(result);
    return result;
  }
  
  const getOwner = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const tokenId = await getTokenId(didName);
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {owner_of: {token_id: tokenId, include_expired: true}});  
    setOwnerInfo(result);
    return result;
  }
  
  const getNFTNumber = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {num_tokens: {}});  
    setNumTokens(result.count);
    return result.count;
  }
  
  const getMyAllNFTs = async (start_after) => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], 
      {
        tokens: 
        {
          owner: connectedWallet?.terraAddress,
          start_after,
          limit:10
        }
      });  
    const nftInfos = [];
    for (let i = 0; i < result.tokens.length; i++) {
      let nftInfo = await lcd.wasm.contractQuery(contractAddrs['registrar'], {nft_info: {token_id: result.tokens[i]}}); 
      nftInfos.push(nftInfo);
    }
    setMyNFTs(nftInfos);
    return result.tokens;
  }
  
  const getAllNFTs = async (start_after) => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], 
      {
        all_tokens: 
        {
          start_after,
          limit:10
        }
      });  
    const nftInfos = [];
    for (let i = 0; i < result.tokens.length; i++) {
      let nftInfo = await lcd.wasm.contractQuery(contractAddrs['registrar'], {nft_info: {token_id: result.tokens[i]}}); 
      nftInfos.push(nftInfo);
    }
    setAllNFTs(nftInfos);
    return result.tokens;
  }

  const resolveDid = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    let nodeInfo = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_node_info: {name: didName}});  
    const node = [...new Uint8Array(nodeInfo.node)];

    try {
      let result = await lcd.wasm.contractQuery(contractAddrs['resolver'], {get_terra_address: {node}});   
      setResolvedAddress(result.address);
      return result.address; 
    } catch (error) {
      setResolvedAddress('NO');
    }
  }

  /*
  pub fn get_token_id_from_name(name: &String) -> StdResult<TokenIdResponse> {
      let label: Vec<u8> = get_label_from_name(&name);
      let token_id = get_token_id_from_label(&label);
      Ok(TokenIdResponse { token_id })
  }
  pub fn get_label_from_name(name: &String) -> Vec<u8> {
      keccak256(name.as_bytes())
  }
  pub fn get_token_id_from_label(label: &Vec<u8>) -> String {
      hex::encode(label)
  }
  */
 /*
    init: js namehash("lunc")  =>  decode_node_string_to_bytes(namehash("lunc"))
    pub fn decode_node_string_to_bytes(node: String) -> Result<Vec<u8>, hex::FromHexError> {
        hex::decode(node)
    }

    pub struct Config {
        pub grace_period: u64,
        pub owner: CanonicalAddr,
        pub base_node: Vec<u8>,
        pub base_name: String,
        pub reverse_node: Vec<u8>,
        pub reverse_name: String,
        pub registry_address: CanonicalAddr,
    }
    pub fn get_base_node(&self, deps: Deps) -> StdResult<GetBaseNodeResponse> {
        let base_node = CONFIG.load(deps.storage)?.base_node;
        Ok(GetBaseNodeResponse {
            base_node: encode_node_bytes_to_string(base_node),
        })
    }
    pub fn encode_node_bytes_to_string(node: Vec<u8>) -> String {
        hex::encode(node)
    }
 */
  const getTokenId = async (name) => {
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_token_id: {name}});    
    return result.token_id;
    //return namehash(name).substring(2);
  }

  const getNameHashOf = async (name) => {
    let tokenId = await getTokenId(name);  
    var node = ''
    for (var i = 0; i < 32; i++) {
      node += '00'
    }  
    const nameHash = SHA256(new Buffer(node + tokenId, 'hex'));
    setTokenIdOfNode(nameHash);
    return nameHash;
  }

  const isOwnerRegistrar = async (name) => {
    const nameHash = new Uint8Array(hex2ab(namehash(name)));  // GetIsNodeOwner
    console.log([...nameHash]);
    let result = await lcd.wasm.contractQuery(contractAddrs['registry'], {get_is_node_owner: {node: [...nameHash], address: contractAddrs['registrar']}});    
    console.log(name, result);
    setIsOwner(result);
  }

  const getNodeInfo = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_node_info: {name: didName}});    
    const label = [...new Uint8Array(result.label)].map(x => x.toString(16).padStart(2, '0')).join('');
    const node = [...new Uint8Array(result.node)].map(x => x.toString(16).padStart(2, '0')).join('');
    setNodeInfo(JSON.stringify({label, node, tokenId: result.token_id}));
    //alert(result['is_valid_name'] ? 'valid' : 'NOT valid');
  }

  const getRentPrice = async (hide) => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    if (duration < parseInt(minRegisterDuration) || duration == null) {
      alert("Please input valid duration");
      return;
    }
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {rent_price: {name: didName, duration}});    
    
    setRentPrice(result.price);
  }

  const getCommitment = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    let result = await lcd.wasm.contractQuery(
      contractAddrs['controller'], { 
        get_commitment: {
          name: didName, 
          owner: connectedWallet?.terraAddress,
          resolver: contractAddrs['resolver'],
          address: connectedWallet?.terraAddress,
          secret
        }
      }
    );
    console.log('getCommitment', result);    
    setCommitment(result.commitment);  
    return result.commitment;
  }

  const getCommitmentTimestamp = async () => {
    if (commitment == '' || commitment == null) {
      await getCommitment();
    }
    if (commitConfigInfo == '' || commitConfigInfo == null) {
      await getCommitmentInfo();
    }
    const commitInfoObj = JSON.parse(commitConfigInfo);
    try {
      let result = await lcd.wasm.contractQuery(
        contractAddrs['controller'],
        { 
          commitment_timestamp: {
            commitment
          }
        }
      ); 
      console.log('getCommitmentTimestamp', result);
      setValidRegisterTime('valid time of register: ' + 
            new Date((result.timestamp + commitInfoObj.minAge) * 1000).toLocaleString() + ' ~ ' +
            new Date((result.timestamp + commitInfoObj.maxAge) * 1000).toLocaleString());
      return result.timestamp + commitInfoObj.maxAge;
    } catch (error) {
      console.log(error);
      setValidRegisterTime('NO commit');
      return 0;
    }
  }

  const clearLog = () => {
    setNameRegisterableInfo('');
    setNodeInfo('');
    setCommitConfigInfo('');
    setCommitment('');
    setRentPrice(0);
    setValidRegisterTime('');
  }

  /**
   * 十六进制转 bytearray
   */
  const hex2ab = (hex) => {
    var typedArray = new Uint8Array((hex.match(/[\da-f]{2}/gi)).map(function (h) {
      return parseInt(h, 16)
    }))

    var buffer = typedArray.buffer
    return buffer
  }

  // ArrayBuffer转16进度字符串示例
  // const ab2hex = (buffer) => {
  //   var hexArr = Array.prototype.map.call(
  //     new Uint8Array(buffer),
  //     function (bit) {
  //       return ('00' + bit.toString(16)).slice(-2)
  //     }
  //   )
  //   return hexArr.join('');
  // }

  return (
    <div>
      <h1>Admin</h1>
      <h3>Controller::SetConfig</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <textarea id='config' name='config' rows={10} cols={30} defaultValue={JSON.stringify(defaultConfig)}></textarea>
          <button onClick={setConfig}>Set Config</button>
        </div>
      )}
      <h3>Controller::SetRoot</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <textarea id='whitelist' name='whitelist' rows={10} cols={30} defaultValue={whitelistStr}></textarea>
          <button onClick={getRoot}>Get Root</button>
          <button style={{marginLeft:2, color: 'red'}} onClick={setRoot}>Set Root to Contract</button>
          <button style={{marginLeft:2}} onClick={() => getProof(false)}>Get My Proof</button>
          <br/>
          <pre>root: {rootHash}</pre>
          <br/>
          <pre>my proof:{proof}</pre>
        </div>
      )}
      <h3>Controller::SetEnablePublicMint</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <input type="checkbox" onChange={(evt) => setIsEnablePublicMint(evt.target.checked)} />
          <button style={{marginLeft:2}} onClick={setEnablePublicMint}>Enable Public Mint</button>
        </div>
      )}
      <h3>Controller::SetEnableRegister</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <input type="checkbox" onChange={(evt) => setIsEnableRegistration(evt.target.checked)}/>
          <button style={{marginLeft:2}} onClick={setEnableRegistration}>Enable Registeration</button>
        </div>
      )}
      <h3>Controller::Withdraw</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <div className="input-box">
            <input onChange={evt => setWithdrawAmount(parseInt(evt.target.value))}/>
            <span className="prefix">uluna</span>
          </div>
          <button onClick={withdrawFund}>Withdraw</button>
        </div>
      )}
      <h3 style={{color: 'red'}}>Registrar::AddController</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button onClick={addController}>Add Controller to Registrar</button>
        </div>
      )}
      <h3 style={{color: 'red'}}>Registry::SetSubNodeOwner(.lunc/.reverse)</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button onClick={() => setSubnodeOwnerOfLunc()}>Set SubNode Owner of .lunc</button>
          <button style={{marginLeft:2}} onClick={() => setSubnodeOwner('reverse')}>Set SubNode Owner of .reverse</button>
          <br/><br/>
          <button onClick={() => getNameHashOf('lunc')}>get token id of lunc</button>
          <button style={{marginLeft:2}} onClick={() => getNameHashOf('reverse')}>get token id of reverse</button>
          <br/>
          <pre>token id:{tokenIdOfNode}</pre><br/><br/>
          <button onClick={() => isOwnerRegistrar('lunc')}>check the owner of lunc is registrar</button>
          <button style={{marginLeft:2}} onClick={() => isOwnerRegistrar('reverse')}>check the owner of reverse is registrar</button>
          <br/>
          <pre>is owner:{isOwner ? 'true' : 'false'}</pre>
        </div>
      )}
      <h3 style={{marginTop:5}}>Controller::Get Information</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>          
          <button onClick={getConfig}>Get Mint Config</button>
          <br/>
          <pre>{mintInfo}</pre>
          <br/>   
          <button onClick={getMinRegistrationDuration}>Get Min Register Duration</button>
          <br/>
          <pre>{minRegisterDuration}</pre>
          <br/>  
          <button onClick={getPrice}>Get Price of Different Name Length(3, 4, 5)</button>
          <br/>
          <pre>{price}</pre>
          <br/>
          <button onClick={getRegistarAddr}>Get Registrar Address</button>
          <br/>
          <pre>{registrarAddr}</pre>
          <br/>
          <button onClick={getRegistarConfig}>Get Registrar Config</button>
          <br/>
          <pre>{registrarConfig}</pre>
          <br/>
          <button onClick={getRegistarBaseNode}>Get Registrar Base Name</button>
          <br/>
          <pre>{registrarBaseNode}</pre>
          <br/>
          <button onClick={getRegistarReverseNode}>Get Registrar Reverse Name</button>
          <br/>
          <pre>{registrarReverseNode}</pre>
          <br/>
        </div>
      )}

      <h1>User</h1>
      <div className="input-box">
        <input id="didName" name="didName" value={didName} onChange={evt => setDidName(evt.target.value)}/>
        <span className="prefix">.lunc</span>
      </div>
      <div className="input-box" style={{marginTop:2}}>
        <input value={duration} onChange={evt => setDuration(parseInt(evt.target.value))}/>
        <span className="prefix">seconds</span>
      </div>
      <h3>Register Lunc DID</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button style={{marginTop:2, color:'red'}} onClick={checkNameRegisterable}>Check Name Registerable</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getNodeInfo}>Get Node Info</button>
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={() => getRentPrice(false)}>Get Price</button>
          <br/>
          <button onClick={getCommitmentInfo}>Get Commitment Config Info</button> 
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={getCommitment}>Get Hash of Commitment</button>    
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={commit}>Commit</button>
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={getCommitmentTimestamp}>Get Valid Time of Register</button>
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={register_whitelist}>Register with Whitelist</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={register_public}>Register public</button>
          <br/>
          <button style={{marginTop:2}} onClick={clearLog}>Clear Log</button>
          <br/>
          <pre>
            name registerable info: {nameRegisterableInfo}
          </pre>
          <pre>
            node info: {nodeInfo}
          </pre>
          <pre>commitment config info: {commitConfigInfo}</pre>
          <pre>
            commitment hash: {commitment}
          </pre>
          <pre>
            register fee: {rentPrice > 0 ? rentPrice : '?'} uluna
          </pre>
          <pre>
            valid register time: {validRegisterTime}
          </pre>
        </div>
      )}
      <h3>Query Lunc DID</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button style={{marginTop:2}} onClick={getExpires}>Get Expire Time</button>
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={getNFTInfo}>Get NFT Info</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getOwner}>Get Owner</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getNFTNumber}>Get NFT Number</button> 
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={() => getMyAllNFTs('')}>Get My NFTs</button>  
          <button style={{marginLeft:2, marginTop:2}} onClick={() => getAllNFTs('')}>Get All NFTs</button>  
          <pre>
            {didName}.lunc's Expire Time: {new Date(expireTime * 1000).toLocaleString()}
          </pre>
          <pre>
            {didName}.lunc's NFT info: {JSON.stringify(nftInfo)}
          </pre>
          <pre>
            {didName}.lunc's Owner info: {JSON.stringify(ownerInfo)}
          </pre>
          <pre>
           All NFT number: {numTokens}
          </pre>
          <pre>
           My NFTs: {myNFTs.length + ': ' + JSON.stringify(myNFTs)}
          </pre>
          <pre>
           All NFTs: {allNFTs.length + ': ' + JSON.stringify(allNFTs)}
          </pre>
        </div>
      )}
      <h3>Resolve Lunc DID</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button style={{marginTop:2, color:'red'}} onClick={resolveDid}>Resolve {didName}.lunc</button>
          <pre>
            {didName}.lunc's Resolved Address: {resolvedAddress}
          </pre>
          <input style={{marginTop:2, width: 400}} onChange={evt => setTerraAddress(evt.target.value)}/>
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={setResolvedTerraAddr}>Set Resolved Address</button>
          
        </div>
      )}
      <h3>Transfer Lunc DID</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <input style={{marginTop:2, width: 400}} onChange={evt => setToAddress(evt.target.value)}/>
          <button style={{marginLeft:2, marginTop:2, color:'red'}} onClick={transferNFT}>Transfer</button>
          
        </div>
      )}


      {txResult && (
        <>
          <pre>{JSON.stringify(txResult, null, 2)}</pre>

          {connectedWallet && txResult && (
            <div>
              <a
                href={`https://finder.terra.money/${connectedWallet.network.chainID}/tx/${txResult.result.txhash}`}
                target="_blank"
                rel="noreferrer"
              >
                Open Tx Result in Terra Finder
              </a>
            </div>
          )}
        </>
      )}

      {txError && <pre>{txError}</pre>}

      {(!!txResult || !!txError) && (
        <button
          onClick={() => {
            setTxResult(null);
            setTxError(null);
          }}
        >
          Clear result
        </button>
      )}

      {!connectedWallet && <p>Wallet not connected!</p>}

      {connectedWallet && !connectedWallet.availablePost && (
        <p>This connection does not support post()</p>
      )}
    </div>
  );
}
