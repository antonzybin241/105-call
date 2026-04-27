
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from './wagmi'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
    <WagmiProvider config={wagmiConfig}>
        <App />
    </WagmiProvider>
);
