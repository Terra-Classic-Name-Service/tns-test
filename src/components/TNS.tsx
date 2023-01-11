import { Fee, MsgExecuteContract } from '@terra-money/terra.js';
import {
  CreateTxFailed,
  Timeout,
  TxFailed,
  TxResult,
  TxUnspecifiedError,
  useConnectedWallet,
  UserDenied,
  useLCDClient,
} from '@terra-money/wallet-provider';
import React, { useCallback, useState } from 'react';
import { MerkleTree } from 'merkletreejs';
import pkg from 'js-sha3';
import '../style.css';

const { sha3_256: SHA256 } = pkg;

interface IsValidNameResponse {
  is_valid_name: boolean;
}
interface IsAvailableResponse {
  available: boolean;
}
interface GetExpiresResponse {
  expires: number;
}
interface NftInfoResponse {
  name: string;
  description: string;
  image: string;
  extension: any;
}
interface OwnerOfResponse {
  /// Owner of the token
  owner: string;
  /// If set this address is approved to transfer/send the token as well
  approvals: any;
}
interface TokensResponse {
  /// Contains all token_ids in lexicographical ordering
  /// If there are more than `limit`, use `start_from` in future queries
  /// to achieve pagination.
  tokens: string[],
}
interface NumTokensResponse {
  count: number;
}
interface NodeInfoResponse {
  label: ArrayBuffer;
  token_id: string;
  node: ArrayBuffer;
}
interface AddressResponse {
  address: string;
}
interface TokenIdResponse {
  token_id: string;
}
interface RentPriceResponse {
  price: number;
}
interface GetCommitmentResponse {
  commitment: string;
}

interface CommitmentTimestampResponse {
  timestamp: number
}

const contractAddrs = {'registry': 'terra19rq0rd6f30un2s7lesgsny0e6thhjft7yrnw8p', 
                       'resolver': 'terra1q9q9dqs63a2pyf9a2pegn70pgqfprnlztqlsll',
                       'registrar': 'terra1mycyhz3qmjzxjpy8tlppph0emyhvrsg4hnhz8k',
                       'controller': 'terra1nsgzma8e0kju7wt7fkfypl37c6sdsud6agwlqp'}

const secret = 'luncid';
const GasLimit = 2000000;
const GasPrice = '12335707uluna';

export function TNS() {
  const [txResult, setTxResult] = useState<TxResult | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [mintInfo, setMintInfo] = useState<string | null>(null);
  const [commitConfigInfo, setCommitConfigInfo] = useState<string | null>(null);
  const [minRegisterDuration, setMinRegisterDuration] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [registrarAddr, setRegistrarAddr] = useState<string | null>(null);
  const [didName, setDidName] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(0);
  const [nodeInfo, setNodeInfo] = useState<string | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [validRegisterTime, setValidRegisterTime] = useState<string | null>(null);
  const [rentPrice, setRentPrice] = useState<number>(0);
  const [rootHash, setRootHash] = useState<string>('');
  const [proof, setProof] = useState<string>('');
  const [nameRegisterableInfo, setNameRegisterableInfo] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [isEnablePublicMint, setIsEnablePublicMint] = useState<boolean>(false);
  const [isEnableRegistration, setIsEnableRegistration] = useState<boolean>(false);
  const [expireTime, setExpireTime] = useState<number>(0);
  const [nftInfo, setNftInfo] = useState<any>(null);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [numTokens, setNumTokens] = useState<number>(0);
  const [myNFTs, setMyNFTs] = useState<any[]>([]);
  const [allNFTs, setAllNFTs] = useState<any[]>([]);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [terraAddress, setTerraAddress] = useState<string>('');

  const connectedWallet = useConnectedWallet();
  const lcd = useLCDClient();
  
  const defaultConfig = {
    "owner": connectedWallet?.walletAddress,
    "registrar_address": contractAddrs['registrar'],
    "max_commitment_age": 600,
    "min_commitment_age": 30,
    "min_registration_duration": 90 * 3600 * 24,
    "tier1_price": 1500000,
    "tier2_price": 500000,
    "tier3_price": 250000,
    "enable_registration": true,
    "enable_public_mint": false,
    "start_time": 1673168358,
    "end_time": 1674032358,
    "phase": 1,
    "root": ''
  }

  const whitelistStr = "terra1q43hd97ru800y6mmkwemrhlhnwsn2re2y3fx92;terra1yydvkwm70lswqwsp9atvqk0789prk77nk29pjw;terra1wrrds522sh74d26tp0r4fgj0v5e3npvlv7luch;terra1772z9xeswzar3jq38mgsqvdnw97vkp26vhgf54;terra1tc4jxccs8x5hdzfddl2dzmae6v6m8ksjscqy6h;terra1uvea9l99d27wm8ljvxsdyjz5c8f5eyv4x9shzh";
  
  let proofString = '';

  const setConfig = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    const config = JSON.parse(document.getElementById("config")?.textContent as string);
    const executeMsg = {set_config: config};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
  
  const setEnablePublicMint = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    const executeMsg = {set_enable_public_mint: {enable_public_mint: isEnablePublicMint}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
  
  const withdrawFund = useCallback(() => {
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
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
    let nodeInfo = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_node_info: {name: didName}}) as NodeInfoResponse;  
    const node = [...new Uint8Array(nodeInfo.node)];

    const executeMsg = {set_terra_address: {node, address: terraAddress}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['resolver'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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

  const setEnableRegistration = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    const executeMsg = {set_enable_registration: {enable_registration: isEnableRegistration}};
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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

  const setRoot = useCallback(() => {
    if (!connectedWallet) {
      return;
    }

    const whitelist = (document.getElementById("whitelist")?.textContent as string).split(";");
    const leaves = whitelist.map(x => SHA256(x))
    const tree = new MerkleTree(leaves, SHA256, {sortPairs: true})
    const root = tree.getRoot().toString('hex')
    
    const executeMsg = {
      set_root: {
        root
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
  
  const addController = useCallback(() => {
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
      connectedWallet.walletAddress, 
      contractAddrs['registrar'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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

  const setSubnodeOwner = useCallback(async () => {
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
      connectedWallet.walletAddress, 
      contractAddrs['registry'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      });

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
        owner: connectedWallet?.walletAddress,
        duration,
        secret,
        resolver: contractAddrs['resolver'],
        address: connectedWallet?.walletAddress,
        proof
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      },
      {uluna: parseInt(rentPrice.toString())});

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
        owner: connectedWallet?.walletAddress,
        duration,
        secret,
        resolver: contractAddrs['resolver'],
        address: connectedWallet?.walletAddress,
      }
    };
    //console.log(executeMsg);

    setTxResult(null);
    setTxError(null);
    
    const conctractMsg = new MsgExecuteContract(
      connectedWallet.walletAddress, 
      contractAddrs['controller'],
      {
        ...executeMsg
      },
      {uluna: parseInt(rentPrice.toString())});

    connectedWallet.post({
        fee: new Fee(GasLimit, GasPrice),
        msgs: [
          conctractMsg
        ],
      })
      .then((nextTxResult: TxResult) => {
        console.log(nextTxResult);
        setTxResult(nextTxResult);
      })
      .catch((error: unknown) => {
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
    const whitelist = (document.getElementById("whitelist")?.textContent as string).split(";");
    const leaves = whitelist.map(x => SHA256(x));
    const tree = new MerkleTree(leaves, SHA256, {sortPairs: true});
    const root = tree.getRoot().toString('hex');
    setRootHash(root);
    return root;
  }

  const getProof = (hide: boolean) => {
    const whitelist = (document.getElementById("whitelist")?.textContent as string).split(";");
    const leaves = whitelist.map(x => SHA256(x))
    const tree = new MerkleTree(leaves, SHA256, {sortPairs: true})
    const leaf = SHA256(connectedWallet?.walletAddress.toString() as string);
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
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_mint_info: {}});
    setMintInfo(JSON.stringify(result));
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

  const checkNameRegisterable = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    console.log('check name valid')
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {is_valid_name: {name: didName}}) as IsValidNameResponse;    
    if(!result['is_valid_name']) {
      setNameRegisterableInfo("name should be constructed by a~z 0~9, and length >=3");
      return;
    }
    console.log('check name commitment')
    let hasCommitted = false;
    await getCommitment();
    const maxCommitmentTime = await getCommitmentTimestamp();
    if (maxCommitmentTime * 1000 > new Date().getTime()) {
      hasCommitted = true;
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
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {is_available: {id: tokenId}}) as IsAvailableResponse;  
    return result.available;
  }

  const getExpires = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const tokenId = await getTokenId(didName);
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {get_expires: {id: tokenId}}) as GetExpiresResponse;  
    setExpireTime(result.expires);
    return result.expires;
  }

  const getNFTInfo = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    const tokenId = await getTokenId(didName);
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {nft_info: {token_id: tokenId}}) as NftInfoResponse;  
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
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {owner_of: {token_id: tokenId, include_expired: true}}) as OwnerOfResponse;  
    setOwnerInfo(result);
    return result;
  }
  
  const getNFTNumber = async () => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], {num_tokens: {}}) as NumTokensResponse;  
    setNumTokens(result.count);
    return result.count;
  }
  
  const getMyAllNFTs = async (start_after: string) => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], 
      {
        tokens: 
        {
          owner: connectedWallet?.walletAddress,
          start_after,
          limit:10
        }
      }) as TokensResponse;  
    const nftInfos = [];
    for (let i = 0; i < result.tokens.length; i++) {
      let nftInfo = await lcd.wasm.contractQuery(contractAddrs['registrar'], {nft_info: {token_id: result.tokens[i]}}) as NftInfoResponse; 
      nftInfos.push(nftInfo);
    }
    setMyNFTs(nftInfos);
    return result.tokens;
  }
  
  const getAllNFTs = async (start_after: string) => {
    let result = await lcd.wasm.contractQuery(contractAddrs['registrar'], 
      {
        all_tokens: 
        {
          start_after,
          limit:10
        }
      }) as TokensResponse;  
    const nftInfos = [];
    for (let i = 0; i < result.tokens.length; i++) {
      let nftInfo = await lcd.wasm.contractQuery(contractAddrs['registrar'], {nft_info: {token_id: result.tokens[i]}}) as NftInfoResponse; 
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
    let nodeInfo = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_node_info: {name: didName}}) as NodeInfoResponse;  
    const node = [...new Uint8Array(nodeInfo.node)];

    let result = await lcd.wasm.contractQuery(contractAddrs['resolver'], {get_terra_address: {node}}) as AddressResponse;   
    setResolvedAddress(result.address);
    return result.address; 
  }

  const getTokenId = async (name:String) => {
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_token_id: {name}}) as TokenIdResponse;    
    return result.token_id;
  }

  const getNodeInfo = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {get_node_info: {name: didName}}) as NodeInfoResponse;    
    const label = [...new Uint8Array(result.label)].map(x => x.toString(16).padStart(2, '0')).join('');
    const node = [...new Uint8Array(result.node)].map(x => x.toString(16).padStart(2, '0')).join('');
    setNodeInfo(JSON.stringify({label, node, tokenId: result.token_id}));
    //alert(result['is_valid_name'] ? 'valid' : 'NOT valid');
  }

  const getRentPrice = async (hide: boolean | null) => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    if (duration as number < parseInt(minRegisterDuration as string) || duration == null) {
      alert("Please input valid duration");
      return;
    }
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'], {rent_price: {name: didName, duration}}) as RentPriceResponse;    
    
    setRentPrice(result.price);
  }

  const getCommitment = async () => {
    if (didName == '' || didName == null) {
      alert("Please input name");
      return;
    }
    let result = await lcd.wasm.contractQuery(contractAddrs['controller'],
          { 
            get_commitment: {
              name: didName, 
              owner: connectedWallet?.walletAddress,
              resolver: contractAddrs['resolver'],
              address: connectedWallet?.walletAddress,
              secret
            }
          }
        ) as GetCommitmentResponse;    
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
    const commitInfoObj = JSON.parse(commitConfigInfo as string);
    try {
      let result = await lcd.wasm.contractQuery(contractAddrs['controller'],
            { 
              commitment_timestamp: {
                commitment
              }
            }
          ) as CommitmentTimestampResponse; 
      setValidRegisterTime('valid time of register: ' + 
            new Date((result.timestamp + commitInfoObj.minAge) * 1000).toLocaleString() + ' ~ ' +
            new Date((result.timestamp + commitInfoObj.maxAge) * 1000).toLocaleString());
      return result.timestamp + commitInfoObj.maxAge;
    } catch (error) {
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
  const hex2ab = (hex: string) => {
    var typedArray = new Uint8Array((hex.match(/[\da-f]{2}/gi) as RegExpMatchArray).map(function (h) {
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
          <button style={{marginLeft:2}} onClick={setRoot}>Set Root to Contract</button>
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
          <button onClick={addController}>Add Controller</button>
        </div>
      )}
      <h3 style={{color: 'red'}}>Registry::SetSubNodeOwner(.lunc)</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button onClick={setSubnodeOwner}>Set SubNode Owner</button>
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
        </div>
      )}

      <h1>User</h1>
      <div className="input-box">
        <input id="didName" name="didName" value={didName as string} onChange={evt => setDidName(evt.target.value)}/>
        <span className="prefix">.lunc</span>
      </div>
      <div className="input-box" style={{marginTop:2}}>
        <input value={duration as number} onChange={evt => setDuration(parseInt(evt.target.value))}/>
        <span className="prefix">seconds</span>
      </div>
      <h3>Register Lunc DID</h3>
      {connectedWallet?.availablePost && !txResult && !txError && (
        <div>
          <button style={{marginTop:2}} onClick={checkNameRegisterable}>Check Name Registerable</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getNodeInfo}>Get Node Info</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={() => getRentPrice(false)}>Get Price</button>
          <br/>
          <button onClick={getCommitmentInfo}>Get Commitment Config Info</button> 
          <button style={{marginLeft:2, marginTop:2}} onClick={getCommitment}>Get Hash of Commitment</button>    
          <button style={{marginLeft:2, marginTop:2}} onClick={commit}>Commit</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getCommitmentTimestamp}>Get Valid Time of Register</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={register_whitelist}>Register with Whitelist</button>
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
          <button style={{marginLeft:2, marginTop:2}} onClick={getNFTInfo}>Get NFT Info</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getOwner}>Get Owner</button>
          <button style={{marginLeft:2, marginTop:2}} onClick={getNFTNumber}>Get NFT Number</button> 
          <button style={{marginLeft:2, marginTop:2}} onClick={() => getMyAllNFTs('')}>Get My NFTs</button>  
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
          <button style={{marginTop:2}} onClick={resolveDid}>Resolve {didName}.lunc</button>
          <pre>
            {didName}.lunc's Resolved Address: {resolvedAddress}
          </pre>
          <br/>
          <input style={{marginTop:2, width: 400}} onChange={evt => setTerraAddress(evt.target.value)}/>
          <button style={{marginLeft:2, marginTop:2}} onClick={setResolvedTerraAddr}>Set Resolved Address</button>
          
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