import { useWallet, WalletStatus } from '@terra-money/wallet-provider';

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
  const chainId = 'columbus-5';
  console.log(status, wallets, network);
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
            <text>{wallets != null ? ' ' + wallets[0]?.terraAddress : ''}</text>
          </div>
        )}
      </footer>
    </div>
  );
}
