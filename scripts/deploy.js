const { ethers } = require('hardhat')
const hre = require('hardhat')
const inquirer = require('inquirer')

const config = {
  uniswapV3Factory: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
  weth: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
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
    const output = await uniV3Oracle.assetToEth('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 1000000000, 1800)
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
