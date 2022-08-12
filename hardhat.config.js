require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-local-networks-config-plugin')
require('dotenv').config()

console.log(process.env.RPC_URL_MAINNET)

module.exports = {
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: process.env.RPC_URL_MAINNET,
      },
    },
    mainnet: {
      url: process.env.RPC_URL_MAINNET,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
}
