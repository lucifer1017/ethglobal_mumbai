import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { erc20Abi, parseAbi, type Address } from 'viem'
import { buildPublicClient } from '../src/chain/client.js'
import { getChainConfig } from '../src/chain/registry.js'

// Public, keyless checks only: this does not deploy, swap, approve or spend tokens.
const client = buildPublicClient(11155111)
const network = getChainConfig(11155111)
const router = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E'
const quoter = '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3'
const tokenOut = network.wrappedNativeToken!.address
const chainId = await client.getChainId()
if (chainId !== 11155111) throw new Error('Unexpected Uniswap RPC chain')
const blockNumber = await client.getBlockNumber()
for (const address of [router,quoter] as const) {
  const code = await client.getBytecode({address,blockNumber})
  if (!code || code === '0x') throw new Error('Missing canonical Uniswap contract code')
}
const decimals = await Promise.all([network.stableToken.address,tokenOut].map(address =>
  client.readContract({address,abi:erc20Abi,functionName:'decimals',blockNumber})))
if (decimals[0] !== 6 || decimals[1] !== 18) throw new Error('Unexpected token decimals')
const quote = await client.simulateContract({address:quoter,
  abi:parseAbi(['function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)']),
  functionName:'quoteExactInputSingle',args:[{tokenIn:network.stableToken.address,tokenOut,amountIn:1_000_000n,fee:500,sqrtPriceLimitX96:0n}],blockNumber})
if (quote.result[0] <= 0n) throw new Error('Pool quote returned zero output')
// Optional public address book; a fresh clone needs no local wallet files.
const walletFile = process.argv[2]
const addresses: Record<string, Address> = walletFile ? JSON.parse(readFileSync(walletFile,'utf8')).addresses : {}
const balances: Record<string,unknown> = {}
for (const role of ['executor','sepolia_deployer','demo_subscriber']) {
  const address = addresses[role]
  if (!address) continue
  const [native,usdc] = await Promise.all([
    client.getBalance({address,blockNumber}),
    client.readContract({address:network.stableToken.address,abi:erc20Abi,functionName:'balanceOf',args:[address],blockNumber}),
  ])
  balances[role] = { address,native_base:native.toString(),usdc_base:usdc.toString() }
}
const result = {checkedAt:new Date().toISOString(),verification:'RPC simulation only; no swap or transaction',
  chainId,blockNumber:blockNumber.toString(),router,quoter,tokenIn:network.stableToken.address,tokenOut,
  input_base:'1000000',output_base:quote.result[0].toString(),fee:500,decimals,balances}
const directory = resolve(import.meta.dirname,'../../docs/evidence/U-01')
mkdirSync(directory,{recursive:true})
writeFileSync(resolve(directory,'network-check.json'),JSON.stringify(result,null,2)+'\n')
console.log('Sepolia canonical contract code/decimals and nonzero QuoterV2 simulation verified; public balance evidence saved. No transaction sent.')
