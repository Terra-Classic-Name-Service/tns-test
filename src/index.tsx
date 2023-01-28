import { getChainOptions, WalletProvider } from '@terra-money/wallet-provider';
import { ConnectSample } from 'components/ConnectSample';
import { TNS } from 'components/TNS';
import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';

function App() {
  return (
    <main
      style={{ margin: 20, display: 'flex', flexDirection: 'column', gap: 40 }}
    >
      <ConnectSample />
      <TNS />
    </main>
  );
}

getChainOptions().then((chainOptions) => {
  ReactDOM.render(
    <WalletProvider {...chainOptions}>
      <App />
    </WalletProvider>,
    document.getElementById('root'),
  );
});
