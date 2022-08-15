const { ethers } = require('hardhat')
const hre = require('hardhat')
const inquirer = require('inquirer')

// Arbitrum specific
const WETH_ARBITRUM_ADDRESS = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const WETH_ARBITRUMRINKEBY_ADDRESS = '0xb47e6a5f8b33b3f17603c83a0535a9dcd7e32681'
const DAI_ARBITRUMRINKEBY_ADDRESS = '0xD6ef964d252942CD89Ed43Cd6fF004BA096D3f10'

const config = {
  uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
  weth: WETH_ARBITRUMRINKEBY_ADDRESS,
  defaultFee: '3000',
}

async function sanity() {
  if (!hre.config.etherscan.apiKey) {
    console.log('Missing Etherscan API key!')
    throw new Error('Missing Etherscan API key')
  }
}

async function confirm() {
  console.log(`Will deploy UniswapV3CrossPoolOracle, binded to:`)
  console.log(`  - uniswapV3Factory: ${config.uniswapV3Factory}`)
  console.log(`  - weth: ${config.weth}`)
  console.log(`  - defaultFee: ${config.defaultFee}`)
  console.log()

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed?',
      default: true,
    },
  ])
  console.log()
  return confirmed
}

async function deploy() {
  console.log('Deploying...')
  const UniV3Oracle = await hre.ethers.getContractFactory('UniswapV3CrossPoolOracle')
  const uniV3Oracle = await UniV3Oracle.deploy(config.uniswapV3Factory, config.weth, config.defaultFee)

  await uniV3Oracle.deployed()
  console.log(`Deployed to address: ${uniV3Oracle.address}`)

  return uniV3Oracle
}

async function verify(uniV3Oracle) {
  console.log()

  //Skip Etherscan verification for local testing
  if (hre.network.name === 'localhost' || hre.network.name === 'hardhat') {
    console.log('Verifying Locally...')
    const output = await uniV3Oracle.assetToEth(DAI_ARBITRUMRINKEBY_ADDRESS, ethers.utils.parseEther('1'), 1800)
    return
  }

  console.log('Verifying on Etherscan...')
  await hre.run('verify:verify', {
    address: uniV3Oracle.address,
    constructorArguments: [config.uniswapV3Factory, config.weth, config.defaultFee],
  })
}

async function main() {
  console.log(`Connecting to ${hre.network.name}...`)
  await sanity()
  if (!(await confirm())) {
    console.log('Aborting...')
    return
  }

  // Ok, go ahead and deploy
  const uniV3Oracle = await deploy()
  await verify(uniV3Oracle)

  console.log()
  console.log('All done :)')
}

// Recommended pattern
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
