import { useWallet, WalletStatus, useLCDClient } from '@terra-money/wallet-provider';
import { namehash, hex2ab } from 'utils.js';
import React, { useCallback, useState } from 'react';

export function ConnectSample() {
  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    supportFeatures,
    connect,
    install,
    disconnect,
  } = useWallet();

  const [didName, setDidName] = useState('');
  const lcd = useLCDClient();

  
  const contractAddrs = {'registry': 'terra1f8zucu5l90kvxlsakhv2x5n8rge330mdhmpxrd', 
                          'resolver': 'terra1mmfuq42y9yv9v3uc9s9xuq7tl9wwkf5ruuars0',
                          'registrar': 'terra1zamqfsexrm532neavkqscrckjeajcvyf6dnhem',
                          'controller': 'terra1t7pqe4xvjkls8u64n47jdd58c9tgfem5jsye87'}
  if (didName == '' && wallets != null && wallets[0]?.terraAddress != '' && wallets[0]?.terraAddress != undefined) {
    const node = new Uint8Array(hex2ab(namehash(wallets[0]?.terraAddress + '.reverse')));
    console.log([...node])
    lcd.wasm.contractQuery(contractAddrs['resolver'], {get_name: { node: [...node] }}).then(didName => {
      console.log(didName);
      if (didName.name == undefined) return;
      const name = didName.name.substr(0, didName.name.indexOf("."));
      lcd.wasm.contractQuery(contractAddrs['controller'], {get_token_id: {name}}).then(tokenIdResult => {
        console.log(tokenIdResult);
        if (tokenIdResult.token_id == undefined) return;
        lcd.wasm.contractQuery(contractAddrs['registrar'], {owner_of: {token_id: tokenIdResult.token_id, include_expired: true}}).then(result => {
          console.log(result)
          if (result.owner == wallets[0]?.terraAddress) {
            setDidName(didName.name);
          }
        })
      })
    })    
  }

  return (
    <div>
      <h1>Connect Terra Station</h1>

      <footer>
        {(status === WalletStatus.INITIALIZING || status === WalletStatus.WALLET_NOT_CONNECTED) && (
          <>
            {availableInstallTypes.map((connectType) => (
              <button
                key={'install-' + connectType}
                onClick={() => install(connectType)}
              >
                Install {connectType}
              </button>
            ))}
            {availableConnectTypes.map((connectType) => {
              if (connectType == 'EXTENSION')
              return <button
                  key={'connect-' + connectType}
                  onClick={() => connect(connectType)}
                >
                  Connect {connectType}
                </button>
            })}
          </>
        )}
        {status === WalletStatus.WALLET_CONNECTED && (
          <div>
            <button onClick={() => disconnect()}>Disconnect</button>
            {
              didName != '' ? 
                <text>{didName}</text>
                :
                <text>{wallets != null ? ' ' + wallets[0]?.terraAddress : ''}</text>
            }
          </div>
        )}
      </footer>
    </div>
  );
}
